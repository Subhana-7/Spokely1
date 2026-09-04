import { useEffect, useState } from "react";
import DataTable from "../../components/admin/DataTables";
import SearchFilterBar from "../../components/admin/SearchFilterBar";
import { useNavigate } from "react-router-dom";
import { getPayments } from "../../services/adminService";

interface PaymentItem {
  id: string;
  paypalOrderId: string;
  status: string;
  amount: number;
  currency: string;
  sender?: string;
  receiver?: string;
}

const PaymentManagement = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, _setFilterStatus] = useState("All");

  const [page, setPage] = useState(1);
  const limit = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);

        const res = await getPayments();
        const apiData = res.data.data;

        const formatted = apiData.map((p: any) => ({
          id: p.id,
          paypalOrderId: p.paypalOrderId,
          amount: p.amount,
          status: p.status,
          currency: p.currency,
        }));

        setPayments(formatted);
      } catch (err: any) {
        setError(err.message || "Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.paypalOrderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.currency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.amount.toString().includes(searchQuery);

    const matchStatus =
      filterStatus === "All" ||
      p.status.toLowerCase() === filterStatus.toLowerCase();

    return matchSearch && matchStatus;
  });

  const total = filteredPayments.length;

  const paginatedData = filteredPayments.slice(
    (page - 1) * limit,
    page * limit
  );

  const handleViewDetails = (id: string) => {
    navigate(`/payment/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <div className="rounded-t-3xl pt-12 pb-8 px-8">
          <h2 className="text-3xl font-bold text-white mb-8">
            Payment Management
          </h2>

          <div className=" rounded-lg p-6 text-black">
            {/* Search & Filter */}
            <SearchFilterBar
              searchPlaceholder="Search by sender, receiver or amount"
              filterOptions={["All", "Created", "Completed", "Cancel"]}
              onSearch={(val) => {
                setSearchQuery(val);
                setPage(1);
              }}
              hideMoreFilters={true}
              hideStatusFilter={true}
              // onFilter={(val) => {
              //   setFilterStatus(val);
              //   setPage(1);
              // }}
            />

            {loading ? (
              <p className="text-center py-6 text-gray-500">Loading...</p>
            ) : error ? (
              <p className="text-center py-6 text-red-500">{error}</p>
            ) : (
              <div className="text-white">
                <DataTable
                  type="payment"
                  data={paginatedData}
                  page={page}
                  setPage={setPage}
                  total={total}
                  limit={limit}
                  onRowClick={handleViewDetails}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
