#[cfg(test)]
mod tests {
    use crate::utils::varint::Builder;

    const BUILD_FAILED_STR: &str = "Build failed";

    #[test]
    fn test_7bit_positive_integer() {
        assert_eq!(
            (127, 1),
            Builder::new()
                .slice(vec![127].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 1),
            Builder::new()
                .slice(vec![0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 1),
            Builder::new()
                .slice(vec![42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_14bit_positive_integer() {
        assert_eq!(
            (16383, 2),
            Builder::new()
                .slice(vec![0xBF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 2),
            Builder::new()
                .slice(vec![0x80, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 2),
            Builder::new()
                .slice(vec![0x80, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_21bit_positive_integer() {
        assert_eq!(
            (0x001F_FFFF, 3),
            Builder::new()
                .slice(vec![0xDF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 3),
            Builder::new()
                .slice(vec![0xC0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 3),
            Builder::new()
                .slice(vec![0xC0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_28bit_positive_integer() {
        assert_eq!(
            (0x0FFF_FFFF, 4),
            Builder::new()
                .slice(vec![0xEF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 4),
            Builder::new()
                .slice(vec![0xE0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 4),
            Builder::new()
                .slice(vec![0xE0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_32bit_positive_integer() {
        assert_eq!(
            (0xFFFF_FFFF, 5),
            Builder::new()
                .slice(vec![0xF3, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0xFFFF_FFFF, 5),
            Builder::new()
                .slice(vec![0xF2, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0xFFFF_FFFF, 5),
            Builder::new()
                .slice(vec![0xF1, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0xFFFF_FFFF, 5),
            Builder::new()
                .slice(vec![0xF0, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );

        assert_eq!(
            (0, 5),
            Builder::new()
                .slice(vec![0xF3, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 5),
            Builder::new()
                .slice(vec![0xF2, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 5),
            Builder::new()
                .slice(vec![0xF1, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 5),
            Builder::new()
                .slice(vec![0xF0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );

        assert_eq!(
            (42, 5),
            Builder::new()
                .slice(vec![0xF3, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 5),
            Builder::new()
                .slice(vec![0xF2, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 5),
            Builder::new()
                .slice(vec![0xF1, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 5),
            Builder::new()
                .slice(vec![0xF0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_64bit_positive_integer() {
        assert_eq!(
            (0xFFFF_FFFF_FFFF_FFFF, 9),
            Builder::new()
                .slice(vec![0xF7, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0xFFFF_FFFF_FFFF_FFFF, 9),
            Builder::new()
                .slice(vec![0xF6, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0xFFFF_FFFF_FFFF_FFFF, 9),
            Builder::new()
                .slice(vec![0xF5, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0xFFFF_FFFF_FFFF_FFFF, 9),
            Builder::new()
                .slice(vec![0xF4, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );

        assert_eq!(
            (0, 9),
            Builder::new()
                .slice(vec![0xF7, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 9),
            Builder::new()
                .slice(vec![0xF6, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 9),
            Builder::new()
                .slice(vec![0xF5, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 9),
            Builder::new()
                .slice(vec![0xF4, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );

        assert_eq!(
            (42, 9),
            Builder::new()
                .slice(vec![0xF7, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 9),
            Builder::new()
                .slice(vec![0xF6, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 9),
            Builder::new()
                .slice(vec![0xF5, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (42, 9),
            Builder::new()
                .slice(vec![0xF4, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_negative_varint() {
        assert_eq!(
            (-0xFFFF_FFFF_FFFF_FFFF, 10),
            Builder::new()
                .slice(vec![0xFB, 0xF7, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (-0xFFFF_FFFF_FFFF_FFFF, 10),
            Builder::new()
                .slice(vec![0xFA, 0xF6, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (-0xFFFF_FFFF_FFFF_FFFF, 10),
            Builder::new()
                .slice(vec![0xF9, 0xF5, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (-0xFFFF_FFFF_FFFF_FFFF, 10),
            Builder::new()
                .slice(vec![0xF8, 0xF4, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );

        assert_eq!(
            (0, 10),
            Builder::new()
                .slice(vec![0xFB, 0xF4, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 10),
            Builder::new()
                .slice(vec![0xFA, 0xF5, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 10),
            Builder::new()
                .slice(vec![0xF9, 0xF6, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (0, 10),
            Builder::new()
                .slice(vec![0xF8, 0xF7, 0, 0, 0, 0, 0, 0, 0, 0].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );

        assert_eq!(
            (-42, 10),
            Builder::new()
                .slice(vec![0xFB, 0xF7, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (-42, 10),
            Builder::new()
                .slice(vec![0xFA, 0xF7, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (-42, 10),
            Builder::new()
                .slice(vec![0xF9, 0xF7, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
        assert_eq!(
            (-42, 10),
            Builder::new()
                .slice(vec![0xF8, 0xF7, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_pair()
        );
    }

    #[test]
    fn test_invalid_varint() {
        assert!(Builder::new().slice(vec![].as_slice()).build().is_err());
        assert!(Builder::new().slice(vec![0xBF].as_slice()).build().is_err());
        assert!(Builder::new()
            .slice(vec![0xDF, 0xFF].as_slice())
            .build()
            .is_err());
        assert!(Builder::new()
            .slice(vec![0xEF, 0xFF, 0xFF].as_slice())
            .build()
            .is_err());
        assert!(Builder::new()
            .slice(vec![0xF3, 0xFF, 0xFF, 0xFF].as_slice())
            .build()
            .is_err());
        assert!(Builder::new()
            .slice(vec![0xF7, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
            .build()
            .is_err());
        assert!(Builder::new()
            .slice(vec![0xFB, 0xF7, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF].as_slice())
            .build()
            .is_err());
    }

    #[test]
    fn test_varint_builder_parsing() {
        let builder_varint = Builder::new()
            .slice(vec![0xF7, 0, 0, 0, 0, 0, 0, 0, 42].as_slice())
            .build()
            .expect(BUILD_FAILED_STR);

        assert_eq!(42, builder_varint.parsed_value);
        assert_eq!(9, builder_varint.parsed_bytes);
    }

    #[test]
    fn test_7bit_positive_integer_parse() {
        assert_eq!(
            &vec![127],
            Builder::new()
                .number(&127)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
        assert_eq!(
            &vec![0],
            Builder::new()
                .number(&0)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
        assert_eq!(
            &vec![42],
            Builder::new()
                .number(&42)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
    }

    #[test]
    fn test_14bit_positive_integer_encode() {
        assert_eq!(
            &vec![0xBF, 0xFF],
            Builder::new()
                .number(&16383)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
        assert_eq!(
            &vec![0x80, 128],
            Builder::new()
                .number(&128)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
        assert_eq!(
            &vec![0x80, 255],
            Builder::new()
                .number(&255)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
    }

    #[test]
    fn test_21bit_positive_integer_parse() {
        assert_eq!(
            &vec![0xDF, 0xFF, 0xFF],
            Builder::new()
                .number(&0x001F_FFFF)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
        assert_eq!(
            &vec![0xC0, 0x40, 0],
            Builder::new()
                .number(&16_384)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
    }

    #[test]
    fn test_28bit_positive_integer_parse() {
        assert_eq!(
            &vec![0xEF, 0xFF, 0xFF, 0xFF],
            Builder::new()
                .number(&0x0FFF_FFFF)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
        assert_eq!(
            &vec![0xE0, 0x20, 0, 0],
            Builder::new()
                .number(&2_097_152)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
    }

    #[test]
    fn test_32bit_positive_integer_parse() {
        assert_eq!(
            &vec![0xF0, 0xFF, 0xFF, 0xFF, 0xFF],
            Builder::new()
                .number(&0xFFFF_FFFFu32)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );

        assert_eq!(
            &vec![0xF0, 0x10, 0, 0, 0],
            Builder::new()
                .number(&268_435_456)
                .build()
                .expect(BUILD_FAILED_STR)
                .parsed_vec()
        );
    }
}
