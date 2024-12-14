use std::path::PathBuf;

use openssl::{
    asn1::Asn1Time,
    hash::MessageDigest,
    pkey::PKey,
    rsa::Rsa,
    x509::{
        extension::{BasicConstraints, KeyUsage},
        X509NameBuilder, X509,
    },
};
use tokio_native_tls::native_tls::{self, Identity};
use tracing::trace;

use crate::errors::{certificate_error::CertificateError, AnyError};

pub struct CertificateBuilder {
    load_or_generate_new: bool,
    store_to_project_dir: bool,
    identity: Option<String>,
    data_dir: PathBuf,
}

impl CertificateBuilder {
    pub fn try_from(identity: &Option<String>) -> Self {
        Self {
            load_or_generate_new: false,
            store_to_project_dir: false,
            identity: identity.clone(),
            data_dir: PathBuf::new(),
        }
    }

    pub fn cert_path(mut self, path: PathBuf) -> Self {
        self.data_dir = path;
        self
    }

    pub const fn load_or_generate_new(mut self, load_or_generate_new: bool) -> Self {
        self.load_or_generate_new = load_or_generate_new;
        self
    }

    pub const fn store_to_project_dir(mut self, store_to_project_dir: bool) -> Self {
        self.store_to_project_dir = store_to_project_dir;
        self
    }

    pub fn build(self) -> AnyError<CertificateStore> {
        if !self.data_dir.exists() {
            std::fs::create_dir_all(&self.data_dir)?;
        }

        let certificate_path = self.data_dir.join(
            self.identity
                .as_ref()
                .map_or("certificate.pem".to_string(), |v| format!("cert_{v}.pem")),
        );
        let private_key_path = self.data_dir.join(
            self.identity
                .as_ref()
                .map_or("private_key.pem".to_string(), |v| {
                    format!("priv_key_{v}.pem")
                }),
        );

        if self.load_or_generate_new {
            trace!("Trying to load certificate from project dir");

            if let Some(certificate_store) =
                Self::read_certificates(&certificate_path, &private_key_path)
            {
                trace!("Certificate loaded from project dir: {:?}", self.data_dir);
                return Ok(certificate_store);
            }

            trace!("Generating new certificate");
            let certificate_store = create_tls_certificate()?;

            if self.store_to_project_dir {
                let certificate = certificate_store.certificate.clone();
                let private_key = certificate_store.private_key.clone();

                std::fs::write(certificate_path, certificate)?;
                std::fs::write(private_key_path, private_key)?;
            }

            Ok(certificate_store)
        } else {
            trace!("Loading certificate from project dir");
            Ok(
                Self::read_certificates(&certificate_path, &private_key_path)
                    .ok_or_else(|| Box::new(CertificateError::new("Unable to load project dir")))?,
            )
        }
    }

    fn read_certificates(
        certificate_path: &PathBuf,
        private_key_path: &PathBuf,
    ) -> Option<CertificateStore> {
        match (
            std::fs::read(certificate_path),
            std::fs::read(private_key_path),
        ) {
            (Ok(val1), Ok(val2)) => Some(CertificateStore {
                certificate: val1,
                private_key: val2,
            }),
            _ => None,
        }
    }
}

pub struct CertificateStore {
    certificate: Vec<u8>,
    private_key: Vec<u8>,
}

impl CertificateStore {
    pub fn get_client_certificate(&mut self) -> AnyError<Identity> {
        let identity = native_tls::Identity::from_pkcs8(&self.certificate, &self.private_key)?;

        Ok(identity)
    }
}

fn create_tls_certificate() -> AnyError<CertificateStore> {
    //TODO: Currently we always generate a new certificate. We should store the certificate and private key in a file and only generate a new one if the file does not exist.
    //TODO: We should also check if the certificate is still valid and generate a new one if it is not.
    //TODO: We currently always use fancy-mumble.com as the certificate's common name. We should use a client specified common name instead.

    const KEY_LENGTH: u32 = 2048;
    const COMMON_NAME: &str = "fancy-mumble.com";
    const CERTIFICATE_VALIDITY_DAYS: u32 = 365 * 10;

    let rsa = Rsa::generate(KEY_LENGTH)?;
    let private_key = PKey::from_rsa(rsa)?;

    let mut x509 = X509::builder()?;
    let mut name = X509NameBuilder::new()?;
    name.append_entry_by_text("CN", COMMON_NAME)?;
    let name = name.build();
    x509.set_subject_name(&name)?;
    x509.set_issuer_name(&name)?;
    x509.set_pubkey(&private_key)?;

    let not_before = Asn1Time::days_from_now(0)?;
    let not_after = Asn1Time::days_from_now(CERTIFICATE_VALIDITY_DAYS)?;
    x509.set_not_before(&not_before)?;
    x509.set_not_after(&not_after)?;

    let basic_constraints = BasicConstraints::new().critical().ca().build()?;
    x509.append_extension(basic_constraints)?;
    let key_usage = KeyUsage::new()
        .digital_signature()
        .key_encipherment()
        .build()?;
    x509.append_extension(key_usage)?;
    x509.sign(&private_key, MessageDigest::sha256())?;

    let crt = x509.build().to_pem()?;
    let pkey = private_key.private_key_to_pem_pkcs8()?;

    Ok(CertificateStore {
        certificate: crt,
        private_key: pkey,
    })
}
