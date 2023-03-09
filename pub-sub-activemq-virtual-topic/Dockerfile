FROM node:16-bullseye-slim
ENV TZ=America/Recife
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN mkdir -p /app
WORKDIR /app
COPY . .
CMD ["node", "index.js"]