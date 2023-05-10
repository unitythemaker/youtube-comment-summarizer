type IteratorFunction<T, R> = (item: T) => Promise<R>;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry<T, R>(
  iteratorFn: IteratorFunction<T, R>,
  item: T,
  maxRetries: number
): Promise<R> {
  console.log(`Retrying ${maxRetries} more times...`);
  try {
    return await iteratorFn(item);
  } catch (error) {
    if (maxRetries > 0) {
      await delay(3000);
      return retry(iteratorFn, item, maxRetries - 1);
    } else {
      throw error;
    }
  }
}

export async function asyncPool<T, R>(
  limit: number,
  arr: T[],
  iteratorFn: IteratorFunction<T, R>
): Promise<(R | Error)[]> {
  const results: Promise<R>[] = [];
  const executing: Promise<void>[] = [];

  let completedTasks = 0;

  for (const item of arr) {
    const p = Promise.resolve().then(() => retry(iteratorFn, item, 3));
    results.push(p);

    if (limit <= arr.length) {
      let e: Promise<void>;
      e = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
        completedTasks++;
        console.log(`Progress: ${completedTasks}/${arr.length}`);
      });
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.allSettled(results).then((settledResults) =>
    settledResults.map((result) =>
      result.status === "fulfilled" ? result.value : new Error(result.reason)
    )
  );
}

