# 没有特殊需求，全文都不需要改动，配置文件在启动时挂载，dockerfile里不需要进行单独配置
# 暂时用事件中枢的配置，说不同空间不影响
# FROM nginx:stable-alpine
FROM registry.cn-hangzhou.aliyuncs.com/ps_base/nginx:stable-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY site.template /etc/nginx/conf.d/
ENV API_URL http://dolphinscheduler-standalone-server:12345
CMD envsubst '${API_URL}' < /etc/nginx/conf.d/site.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
COPY dist/  /usr/share/nginx/html/