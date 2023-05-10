# YouTube Comment Summarizer

This project provides a convenient solution for summarizing ideas and suggestions shared in the comments section of [this video](https://www.youtube.com/watch?v=OqnAWFqYVqk). The content creator requested viewers to share their ideas with the prefix "fpfikir-". The project fetches YouTube comments manually using the [YouTube API](https://developers.google.com/youtube/v3/docs/commentThreads/list), filters those with the specified prefix, and utilizes OpenAI's gpt-3.5-turbo to generate a summary of all relevant comments based on [this prompt](config/prompt.txt). The summarized results are saved in [config/summarized.json](config/summarized.json).

Although created for fun, this project can be adapted for various purposes. Please review the [LICENSE](LICENSE) for details.

## Usage

1. Populate config/data\[n\].json with your comments data (see [Getting Your Own Comment Data](#getting_own_data) for instructions).
2. Run `npm run build` to build the code for production.
3. Complete the [.env.tmpl](.env.tmpl) file and rename it as ``.env``.
4. Run `npm start` to initiate the process.
5. (Optional) Utilize a ["JSON to CSV/EXCEL" tool](https://www.google.com/search?hl=en&q=json%20to%20csv) to simplify reading the results (config/summarized.json).

<a name="getting_own_data"></a>

## Getting Your Own Comment Data

To obtain your comment data, follow these steps:

1. Visit the [YouTube API commentThreads list page](https://developers.google.com/youtube/v3/docs/commentThreads/list).
2. Complete the form on the right side:
   - part: Enter `id,snippet`
   - maxResults: Enter `100` (the maximum allowed value)
   - order: Select `time`
   - pageToken: Leave blank for the first run; for subsequent runs, enter the `nextPageToken` value from the previous response (inside quotes)
   - videoId: Enter your video ID (found in the URL after `watch?v=`)
3. Under "Credentials" at the bottom, click "Show scopes" and enable the listed option.
4. Click "EXECUTE" and sign in with a Google account. If the video is public, any Google account can be used.

Repeat the process until there are no remaining pages (totalResults < 100).
