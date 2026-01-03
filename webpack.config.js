const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { DefinePlugin } = require("webpack");

const envVars = require("dotenv").config().parsed || {};

module.exports = {
  entry: "./src/js/app.js", // Main JavaScript entry
  output: {
    // filename: "bundle.[contenthash].js", // Output filename with cache-busting
    filename: "bundle.js",
    path: path.resolve(__dirname, "public"),
    publicPath: "/",
  },
  mode: "production", // For minimized JS and CSS
  module: {
    rules: [
      {
        test: /\.scss$/, // For SCSS files
        use: [
          process.env.NODE_ENV === "production"
            ? MiniCssExtractPlugin.loader // Use MiniCssExtractPlugin in production
            : "style-loader", // Use style-loader in development
          "css-loader", // Transforms CSS into CommonJS
          "sass-loader", // Compiles SCSS to CSS
        ],
      },
      {
        test: /\.(js|jsx)$/, // For JavaScript files
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  optimization: {
    minimize: false, // Minimize output
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new CleanWebpackPlugin(), // Cleans the output directory
    new MiniCssExtractPlugin({
      filename: "styles.[contenthash].css", // CSS output with cache-busting
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: "head",
    }),
    new DefinePlugin({
      AppConfig: JSON.stringify({
        // Usar ruta relativa en todos los casos
        // En desarrollo, webpack-dev-server proxy redirige /api a localhost:8000
        // En producción, server.js sirve tanto frontend como API
        API_BASE_URL: '/api',
      }),
    }),
    // Copy static assets
    // TODO uncomment when assets present
    // new CopyPlugin({
    //   patterns: [
    //     // relative path is from src
    //     // { from: "./static/img/*" },
    //   ],
    // }),
  ],
  devServer: {
    static: path.resolve(__dirname, "public"), // Serve the dist directory
    open: false, // Automatically open the browser
    allowedHosts: ["localhost"],
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    ],
  },
};
