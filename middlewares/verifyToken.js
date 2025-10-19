// export function verifyAuth(req, res, next) {
//   const accessToken = req.cookies.accessToken;
//   const csrfHeader = req.headers["x-csrf-token"];
//   const csrfCookie = req.cookies.csrfToken;

//   if (!accessToken || !csrfHeader || csrfHeader !== csrfCookie) {
//     return res.status(403).json({ message: "CSRF یا توکن معتبر نیست" });
//   }

//   try {
//     const decoded = jwt.verify(accessToken, ACCESS_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "توکن منقضی یا نامعتبر است" });
//   }
// }
