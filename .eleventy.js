module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site-src/static");
  eleventyConfig.addPassthroughCopy("site-src/**/*.{ico,png,xml,webmanifest}");

  return {
    dir: {
      input: "site-src",
      output: "docs"
    }
  };
};