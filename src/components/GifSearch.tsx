import { Box, CircularProgress, Fade, ImageList, ImageListItem, LinearProgress, Paper, Popper, Skeleton, TextField } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';
import { debounce, set } from 'lodash';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { invoke } from "@tauri-apps/api/core";
import { use } from 'i18next';
import { Gif } from '@mui/icons-material';
import ContainedBackdrop from './utils/ContainedBackdrop';
import InfiniteScroll from 'react-infinite-scroll-component';

interface MediaElement {
  webm: {
    size: number;
    duration: number;
    preview: string;
    url: string;
    dims: [number, number];
  };
  tinywebm: {
    preview: string;
    dims: [number, number];
    url: string;
    size: number;
    duration: number;
  };
  webp_transparent: {
    url: string;
    size: number;
    preview: string;
    dims: [number, number];
    duration: number;
  };
  tinygif: {
    size: number;
    preview: string;
    dims: [number, number];
    duration: number;
    url: string;
  };
  tinymp4: {
    dims: [number, number];
    preview: string;
    size: number;
    url: string;
    duration: number;
  };
  gif: {
    size: number;
    preview: string;
    duration: number;
    dims: [number, number];
    url: string;
  };
  nanowebp_transparent: {
    duration: number;
    url: string;
    preview: string;
    size: number;
    dims: [number, number];
  };
  tinywebp_transparent: {
    preview: string;
    size: number;
    dims: [number, number];
    url: string;
    duration: number;
  };
  nanomp4: {
    size: number;
    duration: number;
    dims: [number, number];
    preview: string;
    url: string;
  };
  nanowebm: {
    url: string;
    dims: [number, number];
    preview: string;
    size: number;
    duration: number;
  };
  mp4: {
    duration: number;
    preview: string;
    url: string;
    size: number;
    dims: [number, number];
  };
  loopedmp4: {
    url: string;
    size: number;
    preview: string;
    dims: [number, number];
    duration: number;
  };
  nanogif: {
    duration: number;
    size: number;
    preview: string;
    dims: [number, number];
    url: string;
  };
  mediumgif: {
    url: string;
    dims: [number, number];
    size: number;
    preview: string;
    duration: number;
  };
};

export interface GifResult {
  id: string;
  title: string;
  content_description: string;
  content_rating: string;
  h1_title: string;
  media: MediaElement[];
  bg_color: string;
  created: number;
  itemurl: string;
  url: string;
  tags: string[];
  flags: string[];
  shares: number;
  hasaudio: boolean;
  hascaption: boolean;
  source_id: string;
  composite: any;
}

interface GifResultContainer {
  results: GifResult[];
  next: string;
}

interface EmptyResult {

}

function instanceOfEmptyResult(object: any): object is EmptyResult {
  return Object.keys(object)?.length === 0;
}

interface ErrorElement {
  code: number;
  error: string;
}

function instanceOfErrorElement(object: any): object is ErrorElement {
  return 'code' in object && 'error' in object;
}

interface GifSearchProps {
  open: boolean;
  anchor: HTMLElement | undefined;
  onGifSelected?: (gif: GifResult) => void;
  ready?: boolean;
}

const defaultProps: GifSearchProps = {
  ready: true,
  open: false,
  anchor: undefined,
};

const LOAD_ELEMENTS = 20;

const handleSearchChange = debounce(async (
  value: string,
  tenorApiKey: string | undefined,
  setItemData: React.Dispatch<React.SetStateAction<GifResultContainer | ErrorElement | EmptyResult[]>>
) => {
  if (tenorApiKey) {
    if (value.length === 0) {
      const result = await invoke('get_tenor_trending_results', {
        apiKey: tenorApiKey
      });
      const resultObj = JSON.parse(result as string);
      setItemData(resultObj as GifResultContainer);
      return;
    }
    const result = await invoke('get_tenor_search_results', {
      apiKey: tenorApiKey,
      query: value,
      limit: LOAD_ELEMENTS,
      pos: 0,
    });
    const resultObj = JSON.parse(result as string);
    console.log(resultObj);

    setItemData(resultObj as GifResultContainer);
  }
}, 1000);

function GifSearch(props: Readonly<GifSearchProps>) {
  const frontendSettings = useSelector((state: RootState) => state.reducer.frontendSettings);
  const tenorApiKey = frontendSettings.api_keys?.tenor;

  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState(0);
  const [itemData, setItemData] = useState<GifResultContainer | ErrorElement | EmptyResult[]>([]);
  let tenorApiKeyAvailable = tenorApiKey && tenorApiKey.length > 0;

  useEffect(() => {
    setPosition(0);
    handleSearchChange(search, tenorApiKey, setItemData);
  }, [search]);

  const loadMore = async () => {
    console.log("Load more");
    if (tenorApiKey && search.length > 0) {
      invoke('get_tenor_search_results', {
        apiKey: tenorApiKey,
        query: search,
        limit: LOAD_ELEMENTS,
        pos: position + LOAD_ELEMENTS,
      }).then((result) => {
        const resultObj = JSON.parse(result as string);

        if (instanceOfEmptyResult(itemData) || instanceOfErrorElement(itemData)) {
          setItemData(resultObj as GifResultContainer);
        }

        let currentData = itemData as GifResultContainer;
        currentData.results.push(...(resultObj as GifResultContainer).results);
        setItemData(currentData);
        console.log(itemData);
        setPosition(position + LOAD_ELEMENTS);
      });
    }
  }

  useEffect(() => {
    if (!tenorApiKey || tenorApiKey.length === 0) {
      return;
    }

    invoke('get_tenor_trending_results', {
      apiKey: tenorApiKey
    }).then((result) => {
      const resultObj = JSON.parse(result as string);
      if (resultObj.error) {
        console.log(resultObj.error);
        return;
      }
      setItemData(resultObj as GifResultContainer);
    }).catch(e => {
      console.log(e);
    });
  }, [tenorApiKey]);

  function handleGifClick(gif: GifResult) {
    if (props.onGifSelected) {
      props.onGifSelected(gif);
      setSearch("");
    }
  }

  const showImageList = useMemo(() => {
    if (instanceOfEmptyResult(itemData) || instanceOfErrorElement(itemData)) {
      return (
        <ImageListItem>
          <Skeleton variant="rectangular" width={180} height={100} />
        </ImageListItem>
      );
    }

    let results = (itemData as GifResultContainer).results;
    return (
      results.map((item, i) => {
        const imgElement = item as GifResult;

        return (
          <ImageListItem key={imgElement.id} sx={{ cursor: 'pointer' }}>
            <img src={imgElement.media[0].nanogif.url} alt={imgElement.title} loading="lazy" onClick={() => handleGifClick(imgElement)} />
          </ImageListItem>
        );

      })
    );
  }, [itemData, position]);

  const loadingElement = useMemo(() => {
    return (
      <Box>
        <LinearProgress />
      </Box>
    );
  }, []);

  return (
    <Popper open={props.open} anchorEl={props.anchor} transition>
      {({ TransitionProps }) => (
        <Fade {...TransitionProps}>
          <Paper sx={{ p: 1 }}>
            <Box>
              <TextField
                autoFocus
                fullWidth
                label={t("Search Tenor")}
                InputProps={{
                  endAdornment: <SearchIcon />,
                }}
                size='small'
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                }}
              />
            </Box>
            <Box id="scrolableDiv" sx={{ width: '100%', height: 450, overflowY: 'scroll' }}>
              <ContainedBackdrop open={props.ready || !tenorApiKeyAvailable || false}>
                <InfiniteScroll
                  dataLength={(itemData as GifResultContainer).results?.length ?? 0}
                  next={loadMore}
                  hasMore={true}
                  loader={loadingElement}
                  scrollableTarget="scrolableDiv"
                >
                  <ImageList sx={{ width: 400 }} cols={3} rowHeight={164} variant="masonry" >
                    {showImageList}
                  </ImageList>
                </InfiniteScroll>
              </ContainedBackdrop>
            </Box>
            {tenorApiKeyAvailable ? null : <Box>{t("Tenor API Key not set")}</Box>}
          </Paper>
        </Fade>
      )}
    </Popper>
  )
}

GifSearch.defaultProps = defaultProps;

export default GifSearch