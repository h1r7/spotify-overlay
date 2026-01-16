/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // CORS Settings: Allow Spicetify to send data without being blocked
  async headers() {
    return [
      {
        // Set to "/update" matching the path in (app/update/route.ts)
        source: "/update",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ]
  },
};

export default nextConfig;