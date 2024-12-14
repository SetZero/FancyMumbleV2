use symphonia::core::audio::{AudioBufferRef, Signal};
use symphonia::core::codecs::CodecParameters;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

use crate::errors::AnyError;

struct Resampler {
    target_sampling_rate: u32,
    target_bit_depth: u32,
}

impl Resampler {
    fn new(target_sampling_rate: u32, target_bit_depth: u32) -> Resampler {
        Resampler {
            target_sampling_rate,
            target_bit_depth,
        }
    }

    fn resample(&self, samples: &mut [f32]) -> AnyError<()> {
        /*// Define the input and output byte slices
        let mut output_bytes: Vec<u8> = Vec::new(); // create an empty vector for the output bytes

        // Create a hint to help the format detector
        let mut hint = Hint::new();

        // Set the file extension
        hint.with_extension("wav");

        // Create a media source from the input byte slice
        let mss = MediaSourceStream::new(Box::new(samples), Default::default());

        // Use the default options for metadata and format
        let metadata_opts = MetadataOptions::default();
        let format_opts = FormatOptions::default();

        // Probe the media source for the format
        let format =
            symphonia::default::get_probe().format(&hint, mss, &format_opts, &metadata_opts)?;

        // Get the default stream from the format
        let stream = format.default_stream()?;

        // Get the codec parameters from the stream
        let codec_params = stream.codec_params();

        // Get the original sampling rate and bit depth from the codec parameters
        let original_sampling_rate = codec_params.sample_rate.unwrap_or(0);
        let original_bit_depth = codec_params.bits_per_sample.unwrap_or(0);

        // Check if the input byte slice is already PCM encoded
        if codec_params.codec != symphonia::core::codecs::CODEC_TYPE_PCM_F32BE {
            return Err("The input byte slice is not PCM encoded".into());
        }

        // Check if the input byte slice has a higher bitrate than the target bitrate
        if original_sampling_rate * original_bit_depth
            <= self.target_sampling_rate * self.target_bit_depth
        {
            return Err(
                "The input byte slice already has a lower or equal bitrate than the target bitrate"
                    .into(),
            );
        }

        // Create a new codec parameters for the output byte slice
        let mut output_codec_params = CodecParameters::new();

        // Set the codec to PCM
        output_codec_params.with_codec(symphonia::core::codecs::CODEC_TYPE_PCM_F32BE);

        // Set the target sampling rate and bit depth
        output_codec_params.with_sample_rate(self.target_sampling_rate);
        output_codec_params.with_bits_per_sample(self.target_bit_depth);

        // Set the number of channels and channel layout to match the input byte slice
        output_codec_params.with_channels(codec_params.channels);
        output_codec_params.with_channel_layout(codec_params.channel_layout);

        // Create a resampler to convert the input sampling rate to the target sampling rate
        let resampler = symphonia::core::audio::resample::Converter::new(
            codec_params.channels,
            original_sampling_rate,
            TARGET_SAMPLING_RATE,
        );

        // Create a quantizer to convert the input bit depth to the target bit depth
        let quantizer = symphonia::core::audio::quantize::ScalarQuantizer::new(
            codec_params.channels,
            original_bit_depth,
            TARGET_BIT_DEPTH,
        );

        // Loop through the packets in the input byte slice
        while let Ok(packet) = format.next_packet() {
            // Decode the packet into an audio buffer
            let decoded = format.decode(&packet)?;

            // Resample the audio buffer to the target sampling rate
            let resampled = resampler.process(decoded);

            // Quantize the audio buffer to the target bit depth
            let quantized = quantizer.process(resampled);

            // Convert the quantized audio buffer to a byte slice
            let bytes = quantized.as_bytes();

            // Append the bytes to the output vector
            output_bytes.extend_from_slice(bytes);
        }

        // Return the output vector as a byte slice
        Ok(&output_bytes[..])*/
        Ok(())
    }
}
