import React from "react";
import { Container, Typography } from "@mui/material";
import LostAndFoundList from "../modules/lostAndFound/LostAndFoundList";

const LostAndFoundPage = () => {
  return (
    <Container maxWidth="md">

      {/* ✅ Only render the list (form is already inside the list) */}
      <LostAndFoundList />
    </Container>
  );
};

export default LostAndFoundPage;
