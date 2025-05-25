import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <title>Fusen Share - リアルタイム付箋共有ボード</title>
        <meta name="description" content="リアルタイムで共有できる付箋ボード。チームでのブレインストーミングやアイデア共有に最適です。" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <props.Component />
    </>
  );
}
