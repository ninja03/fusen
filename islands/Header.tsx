interface HeaderProps {
  currentPage?: "home" | "help";
}

export default function Header({ currentPage = "home" }: HeaderProps) {
  return (
    <header class="bg-white shadow-lg border-b-4 border-gradient-to-r from-yellow-400 to-pink-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-pink-600 bg-clip-text text-transparent">
                📝 Fusen Share
              </h1>
            </div>
          </div>
          
          <nav class="flex space-x-8">
            <a 
              href="/" 
              class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === "home" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "text-gray-700 hover:text-yellow-600"
              }`}
            >
              ボード
            </a>
            <a 
              href="/help" 
              class={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === "help" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "text-gray-700 hover:text-yellow-600"
              }`}
            >
              ヘルプ
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}