use reqwest::redirect::Policy;
use scraper::{Html, Selector};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct OpenGraphMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
}

pub struct OpenGraphCrawler {
    client: reqwest::Client,
}

impl OpenGraphCrawler {
    pub fn try_new() -> Option<Self> {
        let client = reqwest::Client::builder()
            .redirect(Policy::limited(10))
            .user_agent("FancyMumbleClient/0.1.0")
            //.cookie_store(true)
            .build()
            .ok()?;
        Some(Self { client })
    }

    pub async fn crawl(&self, url: &str) -> Option<OpenGraphMetadata> {
        let response = self.client.get(url).send().await.ok()?;
        let body = response.text().await.ok()?;
        let document = Html::parse_document(&body);

        let mut title = Self::extract_metadata(&document, "og:title");
        let description = Self::extract_metadata(&document, "og:description");
        let image = Self::extract_metadata(&document, "og:image");

        if title.is_none() {
            title = Self::extract_property(&document, "title");
        }

        Some(OpenGraphMetadata {
            title,
            description,
            image,
        })
    }

    fn extract_metadata(document: &Html, property: &str) -> Option<String> {
        let selector = Selector::parse(&format!("meta[property='{property}']")).ok()?;
        let element = document.select(&selector).next()?;
        element.value().attr("content").map(String::from)
    }

    fn extract_property(document: &Html, property: &str) -> Option<String> {
        let selector = Selector::parse(property).ok()?;
        let element = document.select(&selector).next()?;
        Some(element.children().next()?.value().as_text()?.to_string())
    }
}
