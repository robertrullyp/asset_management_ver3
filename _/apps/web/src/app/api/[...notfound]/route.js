const handler = () =>
  Response.json(
    { error: "Not Found" },
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
  handler as OPTIONS,
};
