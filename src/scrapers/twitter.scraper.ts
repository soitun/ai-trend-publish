import {
  ContentScraper,
  ScraperOptions,
  ScrapedContent,
} from "./interfaces/scraper.interface";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

export class TwitterScraper implements ContentScraper {
  private xApiBearerToken: string | undefined;

  constructor() {
    this.validateConfig();
    this.xApiBearerToken = process.env.X_API_BEARER_TOKEN;
  }

  async validateConfig() {
    if (!process.env.X_API_BEARER_TOKEN) {
      throw new Error(
        "X API Bearer Token is not set, please set X_API_BEARER_TOKEN in .env file"
      );
    }
  }

  formatDate(dateString: string) {
    const date = new Date(Date.parse(dateString.replace(/(\+\d{4})/, "UTC$1")));
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}/${month}/${day}`;
  }

  async scrape(
    sourceId: string,
    options?: ScraperOptions
  ): Promise<ScrapedContent[]> {
    const usernameMatch = sourceId.match(/x\.com\/([^\/]+)/);
    if (!usernameMatch) {
      throw new Error("Invalid Twitter source ID format");
    }

    const username = usernameMatch[1];
    console.log(`Processing Twitter user: ${username}`);

    try {
      const query = `from:${username} -filter:replies within_time:24h`;
      const apiUrl = `https://api.twitterapi.io/twitter/tweet/advanced_search?query=${encodeURIComponent(
        query
      )}&queryType=Top`;

      const response = await fetch(apiUrl, {
        headers: {
          "X-API-Key": `${this.xApiBearerToken}`,
        },
      });

      if (!response.ok) {
        const errorMsg = `Failed to fetch tweets: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const tweets = await response.json();
      const scrapedContent: ScrapedContent[] = tweets.tweets
        .slice(0, 10)
        .map((tweet: any) => ({
          id: tweet.id,
          title: tweet.text.split("\n")[0],
          content: tweet.text,
          url: `https://x.com/${username}/status/${tweet.id}`,
          publishDate: this.formatDate(tweet.createdAt),
          metadata: {
            platform: "twitter",
            username,
          },
        }));

      if (scrapedContent.length > 0) {
        console.log(
          `Successfully fetched ${scrapedContent.length} tweets from ${username}`
        );
      } else {
        console.log(`No tweets found for ${username}`);
      }

      return scrapedContent;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching tweets for ${username}:`, error);
      throw error;
    }
  }
}
