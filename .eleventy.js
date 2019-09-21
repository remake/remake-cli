module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site-src/static");
  eleventyConfig.addPassthroughCopy("site-src/CNAME");
  eleventyConfig.addPassthroughCopy("site-src/**/*.{ico,png,xml,webmanifest,svg}");

  return {
    dir: {
      input: "site-src",
      output: "docs"
    }
  };
};