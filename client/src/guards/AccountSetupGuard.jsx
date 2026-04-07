import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClientInfo } from "../services/clientService";

const AccountSetupGuard = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const checkAccount = async () => {
      try {

        const role = sessionStorage.getItem("userRole");

        // Only check for customer role
        if (role !== "user") {
          setLoading(false);
          return;
        }

        const client = await getClientInfo();

        if (!client.account_setup) {
          navigate("/setup");
          return;
        }

      } catch (err) {
        console.error("Account check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAccount();

  }, [navigate]);

  if (loading) return null;

  return children;
};    

export default AccountSetupGuard;