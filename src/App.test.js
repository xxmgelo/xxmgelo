import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the login screen before authentication", () => {
  render(<App />);
  expect(screen.getByText(/ACLC Fee Management System/i)).toBeInTheDocument();
});
