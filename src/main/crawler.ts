import { ipcMain } from 'electron';
import axios from 'axios';
import * as cheerio from 'cheerio';

export function setupCrawlerHandlers() {
  ipcMain.handle('crawl-url', async (_event, url: string) => {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Extract basic info
      const title = $('title').text();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      // Extract main text content (simplified)
      $('script, style, nav, footer').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

      return {
        success: true,
        data: {
          title,
          description: metaDescription,
          content,
          url
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  });
}
