// Redirects www.iqraspace.org/* -> https://iqraspace.org/* (301), preserving path and query.
// Bound only to the www host, so it can never see apex traffic.
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== "www.iqraspace.org") {
      return new Response("Not found", { status: 404 });
    }
    return Response.redirect(`https://iqraspace.org${url.pathname}${url.search}`, 301);
  },
};
