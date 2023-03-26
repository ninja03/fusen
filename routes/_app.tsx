import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <title>付箋共有</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <props.Component />
    </>
  );
}
