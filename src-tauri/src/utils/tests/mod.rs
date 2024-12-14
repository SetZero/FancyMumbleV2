macro_rules! aw {
    ($e:expr) => {
        tokio_test::block_on($e)
    };
}

mod test_file_utils;
mod test_varint;
