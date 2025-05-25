import { Head } from "$fresh/runtime.ts";

export default function HelpPage() {
  return (
    <>
      <Head>
        <title>Help - Online Sticky Notes</title>
      </Head>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Help</h1>
        <h2 className="text-xl font-bold mb-2">How to Use the Sticky Notes Board</h2>
        <ul className="list-disc pl-5">
          <li className="mb-2">Create a new sticky note: Click anywhere on the empty board.</li>
          <li className="mb-2">Edit a sticky note: Click inside the text area of a sticky note and start typing.</li>
          <li className="mb-2">Move a sticky note: Click and drag the sticky note (but not on the text area or resize handle).</li>
          <li className="mb-2">Resize a sticky note: Click and drag the resize handle at the bottom-right corner of a sticky note.</li>
          <li className="mb-2">Delete a sticky note: Click the '❎' icon at the top-right corner of a sticky note.</li>
        </ul>
      </div>
    </>
  );
}
