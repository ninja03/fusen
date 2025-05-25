import Header from "@/islands/Header.tsx";

export default function Help() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200">
      <Header currentPage="help" />
      
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-6">📝 Fusen Share の使い方</h1>
          
          <div class="space-y-8">
            <section>
              <h2 class="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
                🎯 基本的な使い方
              </h2>
              <div class="space-y-4">
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h3 class="font-medium text-gray-800">付箋を作成する</h3>
                  <p class="text-gray-600 mt-1">ボード上の空いている場所をクリックすると、新しい付箋が作成されます。</p>
                </div>
                
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h3 class="font-medium text-gray-800">付箋を編集する</h3>
                  <p class="text-gray-600 mt-1">付箋をクリックしてテキストエリアにフォーカスし、文字を入力できます。</p>
                </div>
                
                <div class="bg-green-50 border-l-4 border-green-400 p-4">
                  <h3 class="font-medium text-gray-800">付箋を移動する</h3>
                  <p class="text-gray-600 mt-1">付箋の空白部分をドラッグして、好きな位置に移動できます。</p>
                </div>
                
                <div class="bg-purple-50 border-l-4 border-purple-400 p-4">
                  <h3 class="font-medium text-gray-800">付箋のサイズを変更する</h3>
                  <p class="text-gray-600 mt-1">付箋の右下角をドラッグして、サイズを調整できます。</p>
                </div>
                
                <div class="bg-red-50 border-l-4 border-red-400 p-4">
                  <h3 class="font-medium text-gray-800">付箋を削除する</h3>
                  <p class="text-gray-600 mt-1">付箋の右上にある ❎ ボタンをクリックして削除できます。</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 class="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
                🌐 リアルタイム共有
              </h2>
              <div class="bg-gradient-to-r from-yellow-50 to-pink-50 border border-yellow-200 rounded-lg p-6">
                <p class="text-gray-700 leading-relaxed">
                  このボードは<strong>リアルタイムで共有</strong>されています。
                  複数の人が同時にアクセスして、付箋の作成・編集・移動を行うことができます。
                  変更は即座に他のユーザーにも反映されます。
                </p>
              </div>
            </section>
            
            <section>
              <h2 class="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
                🎨 デザインの特徴
              </h2>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-yellow-50 rounded-lg p-4">
                  <h3 class="font-medium text-gray-800 mb-2">カラフルな付箋</h3>
                  <p class="text-gray-600 text-sm">付箋は自動的に7色の中からランダムに色が割り当てられます。</p>
                </div>
                
                <div class="bg-pink-50 rounded-lg p-4">
                  <h3 class="font-medium text-gray-800 mb-2">アニメーション効果</h3>
                  <p class="text-gray-600 text-sm">ホバー時の回転や拡大効果で、直感的な操作感を提供します。</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 class="text-2xl font-semibold text-gray-700 mb-4 flex items-center">
                💡 使用例
              </h2>
              <div class="space-y-3">
                <div class="flex items-start space-x-3">
                  <span class="flex-shrink-0 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                  <p class="text-gray-700">ブレインストーミングやアイデア出し</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="flex-shrink-0 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                  <p class="text-gray-700">プロジェクトの進捗管理（かんばん風）</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="flex-shrink-0 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                  <p class="text-gray-700">チームでのメモ共有</p>
                </div>
                <div class="flex items-start space-x-3">
                  <span class="flex-shrink-0 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">4</span>
                  <p class="text-gray-700">学習用のマインドマップ作成</p>
                </div>
              </div>
            </section>
          </div>
          
          <div class="mt-8 text-center">
            <a 
              href="/" 
              class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-pink-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              ボードに戻る
            </a>
          </div>
        </div>
      </div>
      
      <footer class="bg-white border-t border-gray-200 py-8">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <div class="space-y-4">
            <div class="flex justify-center space-x-6 text-sm text-gray-600">
              <span>バージョン 1.0</span>
              <span>•</span>
              <span>Fresh Framework 製</span>
              <span>•</span>
              <span>Deno 対応</span>
            </div>
            
            <div class="text-xs text-gray-500">
              <p>このアプリケーションはオープンソースです。</p>
              <p class="mt-1">© 2024 Fusen Share. リアルタイム付箋共有システム</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}