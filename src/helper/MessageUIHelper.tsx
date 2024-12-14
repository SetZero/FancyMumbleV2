import { Box, Container } from '@mui/material';
import parse, { DOMNode, HTMLReactParserOptions, domToReact } from 'html-react-parser';
import LightBoxImage from '../components/LightBoxImage';
import UrlPreview from '../components/UrlPreview';

export default class MessageUIHelper {
    private input: string;
    private _containsImages: boolean = false;
    private loaded: (() => void) | undefined;

    constructor(input: string, loaded?: () => void) {
        this.input = input;
        this.loaded = loaded;
    }

    get containsImages() {
        return this._containsImages;
    }

    build() {
        const options: HTMLReactParserOptions = {
            replace: ({ name, attribs, children }: any) => {
                switch (name) {
                    case 'img':
                        this._containsImages = true;
                        return (<Box>
                            <LightBoxImage src={attribs.src} />
                        </Box>);
                    case 'a':
                        return (<Container>
                            <UrlPreview href={attribs.href} onLoaded={this.loaded} />
                        </Container>)
                }
            },
        };

        return parse(this.input, options);
    }
}