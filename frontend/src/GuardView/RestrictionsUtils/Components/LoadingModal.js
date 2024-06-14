import * as React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";

export default function LoadingModal({ loading, setLoading }) {

  return (
    <>
      <Modal
        open={loading}
        onClose={() => setLoading(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <CircularProgress />
        </Box>
      </Modal>
    </>
  );
}

const style = {
  position: "absolute",
  marginTop: "45%",
  width: "100%",
  height: "100",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};