import { Head } from "$fresh/runtime.ts";

export default function({ Component }) {
  return (
    <>
      <Head>
        <title>付箋共有</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <Component/>
    </>
  );
}

