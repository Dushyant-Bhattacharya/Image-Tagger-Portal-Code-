/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens:{
        sm1:"540px",
        sm2:"700px",
        md1:"900px"
      }
    },
    
  },
  plugins: [],
};
