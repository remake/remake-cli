const handlebars = require("handlebars");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("site-src/static");
  eleventyConfig.addPassthroughCopy("site-src/CNAME");
  eleventyConfig.addPassthroughCopy("site-src/**/*.{ico,png,xml,webmanifest,svg}");

  handlebars.registerHelper('isPage', function(arg1, arg2, options) {
    return (arg1.replace(/\//g, "") == arg2.replace(/\//g, "")) ? options.fn(this) : options.inverse(this);
  });

  eleventyConfig.setLibrary("hbs", handlebars);

  return {
    dir: {
      input: "site-src",
      output: "docs"
    }
  };
};