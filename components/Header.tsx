import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Online Sticky Notes</h1>
      <nav>
        <a href="/" className="px-3 py-2 hover:bg-gray-700 rounded-md">Board</a>
        <a href="/help" className="px-3 py-2 hover:bg-gray-700 rounded-md ml-2">Help</a>
      </nav>
    </header>
  );
};

export default Header;
