/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // CORS 설정: Spicetify가 데이터를 보낼 때 차단당하지 않도록 허용
  async headers() {
    return [
      {
        // 형님이 설정하신 경로 (app/update/route.ts)에 맞춰 "/update"로 지정했습니다.
        source: "/update",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // 모든 출처 허용
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ]
  },
};

export default nextConfig;