import { readFileSync, writeFileSync } from "fs";
import { asyncPool } from "./utils/async-pool";
import { Configuration, OpenAIApi } from "openai";
import { config as dotenvConfig } from "dotenv";
import fs from "fs";
import path from "path";

dotenvConfig();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const systemPrompt = readFileSync(`${process.cwd()}/config/prompt.txt`, "utf8");

type CommentThread = {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: {
      kind: string;
      etag: string;
      id: string;
      snippet: {
        videoId: string;
        textDisplay: string;
        textOriginal: string;
        authorDisplayName: string;
        authorProfileImageUrl: string;
        authorChannelUrl: string;
        authorChannelId: {
          value: string;
        };
        canRate: boolean;
        viewerRating: string;
        likeCount: number;
        publishedAt: string;
        updatedAt: string;
      };
    };
    canReply: boolean;
    totalReplyCount: number;
    isPublic: boolean;
  };
};

let items = [] as CommentThread[];
let index = 1;

while (fs.existsSync(path.join(process.cwd(), `config/data${index}.json`))) {
  const fileData = fs.readFileSync(
    path.join(process.cwd(), `config/data${index}.json`),
    "utf8",
  );
  const parsedData = JSON.parse(fileData).items;
  items = [...items, ...parsedData];
  index++;
}

console.log(items);

const filtered = items.filter((item) =>
  item.snippet.topLevelComment.snippet.textOriginal.toLowerCase().includes(
    "fpfikir-",
  )
);
const simplified = filtered.map((item) => ({
  id: item.id,
  author: item.snippet.topLevelComment.snippet.authorDisplayName,
  authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId.value,
  text: item.snippet.topLevelComment.snippet.textOriginal,
  textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
  likeCount: item.snippet.topLevelComment.snippet.likeCount,
  publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
  updatedAt: item.snippet.topLevelComment.snippet.updatedAt,
}));

async function summarize(text: string) {
  if (!text) throw new Error("Text is empty while summarizing");

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.25,
    max_tokens: 320,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "assistant",
        content: "OK",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return completion.data.choices[0].message;
}

async function summarizeAndKeepOriginal(item: any) {
  const summary = await summarize(item.text);
  console.log(summary, item.author, item.likeCount);
  return { ...item, summary };
}

async function main() {
  console.log("Ideas:", simplified.length);
  console.log("Summarizing... (This may take a while)");

  const results = await asyncPool(
    2,
    simplified,
    summarizeAndKeepOriginal,
  );

  console.log("Results:", results);
  console.log("Result count:", results.length);

  const sorted = results.sort((a, b) => b.likeCount - a.likeCount);
  const top10 = sorted.slice(0, 10);

  console.log("Top 10:", top10);

  writeFileSync(
    `${process.cwd()}/config/summarized.json`,
    JSON.stringify(results, null, 2),
  );
}

main();
