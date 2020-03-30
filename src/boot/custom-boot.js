import wings from 'wings4'
// "async" is optional
export default async ({
  app,
  router,
  Vue
}) => {
  Vue.prototype.$dbCon = wings('https://geomap-backend.herokuapp.com')
}
