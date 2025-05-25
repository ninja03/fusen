import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Header from "../components/Header.tsx";

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <title>付箋共有</title>
      </Head>
      <Header />
      <props.Component />
    </>
  );
}
