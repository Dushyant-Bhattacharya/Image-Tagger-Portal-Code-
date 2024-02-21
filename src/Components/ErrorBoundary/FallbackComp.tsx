

function FallbackComp() {
  return (
    <div className="w-full h-[100vh] flex flex-col items-center justify-center text-black bg-gradient-to-b from-amber-300 to-red-500 font-semibold text-2xl p-2 ">
      <div className="flex flex-col bg-neutral-200 bg-opacity-20 p-3 rounded-lg">
      <h3>OOPS , App crashed !!</h3>
      <div className="flex flex-row gap-2">
        <h3>Go to</h3>
        <a href="/" className="text-blue-500 hover:text-blue-600">
          Home
        </a>
      </div>
      </div>
    </div>
  );
}

export default FallbackComp;
