mod tests {
    use crate::utils::file::get_file_as_byte_vec;
    use std::{
        fs::File,
        io::{IoSlice, Write},
    };
    use tempfile::tempdir;

    #[test]
    fn test_file_read() {
        let tmp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = tmp_dir.path().join("my-temporary-note.txt");
        let os_path = file_path.clone();

        let mut tmp_file = File::create(file_path).expect("Failed to create temp file");
        let slice = &[0x00, 0x01, 0x02, 0x03];
        let written = tmp_file
            .write_vectored(&[IoSlice::new(slice)])
            .expect("Failed to write to temp file");

        assert!(
            (written == slice.len()),
            "Failed to write all bytes to temp file"
        );

        let result = aw!(get_file_as_byte_vec(
            os_path
                .as_os_str()
                .to_str()
                .expect("Failed to get os path as str")
        ));
        assert!(result.is_ok());

        let result = result.expect("Failed to get file as byte vec");
        assert_eq!(result.len(), 4);
        assert_eq!(result, slice);

        drop(tmp_file);
        tmp_dir.close().expect("Failed to close temp dir");
    }
}
