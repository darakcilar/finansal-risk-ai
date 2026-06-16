# 1. AŞAMA: Kodları Derleme (Build)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. AŞAMA: Sunucuya Alma (Production)
FROM nginx:alpine
# Vite'ın ürettiği derlenmiş dosyaları (dist), Nginx'in yayın klasörüne kopyalıyoruz
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx varsayılan olarak 80 portunda çalışır
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]