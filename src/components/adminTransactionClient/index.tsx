import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

import arrowDown from "../../../public/assets/images/arrow-down.svg";
import { paymentService } from "../../services/paymentService";

import { PaymentTransactionResponse, PayoutResponse } from "../../services/paymentService";
import { cleanPaymentType } from "../../utils/paymentUtils";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StatsCardSkeleton, TransactionsTableSkeleton } from "@/components/LoadingSkeletons";
import LoadingSpinner from "@/components/LoadingSpinner/index";

const PayoutDetailsModal = ({
    payoutId,
    onClose,
    onPayoutUpdated,
}: {
    payoutId: number;
    onClose: () => void;
    onPayoutUpdated?: () => void;
}) => {
    const [payout, setPayout] = useState<PayoutResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingAsPaid, setMarkingAsPaid] = useState(false);

    useEffect(() => {
        const fetchPayoutDetails = async () => {
            try {
                setLoading(true);
                console.log('Fetching payout details for ID:', payoutId);
                const data = await paymentService.getPayoutById(payoutId);
                console.log('Payout data received:', data);
                setPayout(data);
            } catch (err) {
                console.error('Error fetching payout details:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch payout details');
            } finally {
                setLoading(false);
            }
        };

        fetchPayoutDetails();
    }, [payoutId]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleMarkAsPaid = async () => {
        if (!payout || payout.paid) return;

        try {
            setMarkingAsPaid(true);
            const updatedPayout = await paymentService.markPayoutAsPaid(payout.id);
            setPayout(updatedPayout);
            toast.success(`Payout #${payout.id} has been marked as paid successfully!`);
            if (onPayoutUpdated) {
                onPayoutUpdated();
            }
        } catch (err) {
            console.error('Error marking payout as paid:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark payout as paid';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setMarkingAsPaid(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
                <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative flex items-center justify-center">
                    <LoadingSpinner size="lg" text="Loading payout details..." />
                </div>
            </div>
        );
    }

    if (error || !payout) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
                <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || 'Payout not found'}</p>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
            <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative">
                <div className="w-full flex justify-between h-[60px] border-b-[0.5px] border-[#D9D9D9]">
                    <div className={`flex flex-col`}>
                        <p className={`text-[#022B23] text-[16px] font-medium`}>Payout details</p>
                        <p className="text-[#707070] text-[14px] font-medium">View details of payout request</p>
                    </div>
                    <span className={`w-[77px] text-[12px] font-medium flex justify-center items-center h-[32px] rounded-[8px] border ${payout.paid
                        ? 'text-[#027A48] bg-[#ECFDF3] border-[#027A48]'
                        : 'text-[#DD6A02] bg-[#fffaeb] border-[#DD6A02]'
                        }`}>
                        {payout.paid ? 'paid' : 'Pending'}
                    </span>
                </div>

                <div className="w-full flex flex-col h-[430px] pt-[20px] pb-[2px] gap-[30px]">
                    <div className="flex flex-col h-[79px] gap-[6px]">
                        <p className="text-[16px] font-semibold text-[#022B23]">ID: <span>#{payout.id}</span></p>
                        <p className="text-[14px] font-medium text-[#707070]">Vendor: <span className="text-[#000000] underline">{payout.vendorName || 'Unknown Vendor'}</span></p>
                        <p className="text-[14px] font-medium text-[#707070]">Type: <span className="text-[#000000] underline">Payout</span></p>
                    </div>

                    <div className="flex flex-col w-full pr-[30px]">
                        <p className="text-[14px] text-[#022B23] font-medium">Payout details</p>
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Amount</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">N {payout.paidAmount.toLocaleString()}.00</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Status</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{payout.paid ? 'Paid' : 'Pending'}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Request Date</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{formatDate(payout.requestedAt)}</p>
                            </div>
                            <div className="flex text-start justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Request Time</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{formatTime(payout.requestedAt)}</p>
                            </div>
                            {payout.paid && payout.paidAt && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[14px] text-[#707070] font-medium">Paid Date</p>
                                        <p className="text-[14px] text-[#1E1E1E] font-medium">{formatDate(payout.paidAt)}</p>
                                    </div>
                                    <div className="flex text-start justify-between items-center">
                                        <p className="text-[14px] text-[#707070] font-medium">Paid Time</p>
                                        <p className="text-[14px] text-[#1E1E1E] font-medium">{formatTime(payout.paidAt)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-[97%] px-[22px] flex flex-col gap-[9px] py-[14px] h-[130px] rounded-[24px] border-[1px] border-[#ededed]">
                        <p className="text-[16px] text-[#000000] font-medium">Payout Information</p>
                        <div className="flex flex-col gap-[5px]">
                            <p className="text-[14px] text-[#707070]">PAYOUT ID: #{payout.id}</p>
                            <p className="text-[14px] text-[#707070]">VENDOR: {payout.vendorName || 'Unknown Vendor'}</p>
                            <p className="text-[14px] text-[#707070]">STATUS: {payout.paid ? 'PAID' : 'PENDING'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-3 h-[46px] gap-[6px]">
                    {!payout.paid && (
                        <button
                            onClick={handleMarkAsPaid}
                            disabled={markingAsPaid}
                            className={`justify-center text-[16px] font-medium flex items-center w-[120px] border rounded-[12px] ${markingAsPaid
                                ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'text-[#027A48] border-[#027A48] hover:bg-[#027A48] hover:text-white'
                                }`}
                        >
                            {markingAsPaid ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Processing...
                                </>
                            ) : (
                                'Mark as Paid'
                            )}
                        </button>
                    )}
                    <button onClick={onClose} className="justify-center text-[16px] font-medium flex items-center text-[#022B23] w-[87px] border border-[#022B23] rounded-[12px]">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const TransactionDetailsModal = ({
    transactionId,
    onClose,
}: {
    transactionId: number;
    onClose: () => void;
}) => {
    const [transaction, setTransaction] = useState<PaymentTransactionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactionDetails = async () => {
            try {
                setLoading(true);
                console.log('Fetching transaction details for ID:', transactionId);
                const data = await paymentService.getTransaction(transactionId);
                console.log('Transaction data received:', data);
                setTransaction(data);
            } catch (err) {
                console.error('Error fetching transaction details:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch transaction details');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactionDetails();
    }, [transactionId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };



    if (loading) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
                <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative flex items-center justify-center">
                    <p>Loading transaction details...</p>
                </div>
            </div>
        );
    }

    if (error || !transaction) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
                <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || 'Transaction not found'}</p>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
            <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative">

                <div className="w-full flex justify-between h-[60px] border-b-[0.5px] border-[#D9D9D9]">
                    <div className={`flex flex-col`}>
                        <p className={`text-[#022B23] text-[16px] font-medium`}>View details</p>
                        <p className="text-[#707070] text-[14px] font-medium">View details of transaction</p>
                    </div>
                    <span className={`w-[77px] text-[12px] font-medium flex justify-center items-center h-[32px] rounded-[8px] border ${transaction.status === '0' || transaction.status.toLowerCase() === 'successful' || transaction.status.toLowerCase() === 'completed'
                        ? 'text-[#027A48] bg-[#ECFDF3] border-[#027A48]'
                        : transaction.status.toLowerCase() === 'pending'
                            ? 'text-[#DD6A02] bg-[#fffaeb] border-[#DD6A02]'
                            : 'text-[#FF5050] bg-[#FEF3F2] border-[#FF5050]'
                        }`}>
                        {transaction.status === '0' ? 'Successful' : transaction.status}
                    </span>
                </div>

                <div className="w-full flex flex-col h-[430px] pt-[20px] pb-[2px]  gap-[30px]">
                    <div className="flex flex-col h-[79px] gap-[6px]">
                        <p className="text-[16px] font-semibold text-[#022B23]">ID: <span>{transaction.reference}</span></p>
                        <p className="text-[14px] font-medium text-[#707070]">User: <span className="text-[#000000] underline">{transaction.email}</span></p>
                        <p className="text-[14px] font-medium text-[#707070]">Type: <span className="text-[#000000] underline">{cleanPaymentType(transaction.paymentType)}</span></p>
                    </div>
                    <div className="flex flex-col w-full pr-[30px]">
                        <p className="text-[14px] text-[#022B23] font-medium">Transaction details</p>
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Amount</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">N {transaction.amount.toLocaleString()}.00</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Payment Type</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{cleanPaymentType(transaction.paymentType)}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Date</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{formatDate(transaction.createdAt)}</p>
                            </div>
                            <div className="flex text-start justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Time</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{formatTime(transaction.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-[97%] px-[22px] flex flex-col gap-[9px] py-[14px] h-[130px] rounded-[24px] border-[1px]  border-[#ededed] ">
                        <p className="text-[16px] text-[#000000] font-medium">Transaction Reference</p>
                        <div className="flex flex-col gap-[5px]">
                            <p className="text-[14px] text-[#707070]">REFERENCE: {transaction.reference}</p>
                            <p className="text-[14px] text-[#707070]">STATUS: {transaction.status === '0' ? 'Successful' : transaction.status}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-3 h-[46px] gap-[6px]">
                    <button onClick={onClose} className="justify-center text-[16px] font-medium flex items-center text-[#022B23] w-[87px] border border-[#022B23] rounded-[12px]">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const ActionsDropdown = ({
    children,
    transactionId,
    type = 'transaction',
    onPayoutUpdated
}: {
    children: React.ReactNode;
    transactionId: number;
    type?: 'transaction' | 'payout' | 'refund';
    onPayoutUpdated?: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleViewDetails = () => {
        setShowModal(true);
        setIsOpen(false);
    };

    const handleCloseModal = () => setShowModal(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={handleToggle}
                className="cursor-pointer flex flex-col gap-[3px] items-center justify-center"
            >
                {children}
            </div>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 h-[38px] bg-white rounded-[8px] shadow-lg z-50 border flex items-center justify-center border-[#ededed] w-[175px]">
                    <ul>
                        <li
                            onClick={handleViewDetails}
                            className="px-[8px] py-[4px] h-[38px] text-[12px] hover:bg-[#f9f9f9] text-[#1E1E1E] cursor-pointer flex items-center"
                        >
                            View {type} details
                        </li>
                    </ul>
                </div>
            )}

            {showModal && type === 'transaction' && (
                <TransactionDetailsModal
                    transactionId={transactionId}
                    onClose={handleCloseModal}
                />
            )}

            {showModal && type === 'payout' && (
                <PayoutDetailsModal
                    payoutId={transactionId}
                    onClose={handleCloseModal}
                    onPayoutUpdated={onPayoutUpdated}
                />
            )}

            {showModal && type === 'refund' && (
                <RefundDetailsModal
                    refundId={transactionId}
                    onClose={handleCloseModal}
                    onRefundUpdated={onPayoutUpdated}
                />
            )}
        </div>
    );
};
const TransactionTableRow = ({ transaction, isLast }: { transaction: PaymentTransactionResponse; isLast: boolean }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className={`flex h-[72px] ${!isLast ? 'border-b border-[#EAECF0]' : ''}`}>
            <div className="flex items-center w-[12%] pl-[16px]">
                <p className="text-[#101828] text-[10px] font-medium">{transaction.reference}</p>
            </div>

            <div className="flex items-center justify-center w-[18%] ">
                <p className="text-[#101828] text-[14px] font-medium">
                    {cleanPaymentType(transaction.paymentType).toLowerCase()}
                </p>
            </div>

            <div className="flex flex-col justify-center w-[22%] items-center">
                <p className="text-[#101828] text-[14px] font-medium">{transaction.email}</p>
            </div>

            <div className="flex items-center w-[17%] pl-[24px]">
                <p className="text-[#101828] text-[14px]">N {transaction.amount.toLocaleString()}</p>
            </div>


            <div className="flex flex-col justify-center w-[15%] ">
                <p className="text-[#101828] text-[14px] font-medium">{formatDate(transaction.createdAt)}</p>
                <p className="text-[#667085] text-[14px]">{formatTime(transaction.createdAt)}</p>
            </div>

            <div className="flex items-center w-[13%] px-[10px]">
                <div className={`w-[70px] h-[22px] rounded-[8px] flex items-center justify-center ${transaction.status === '0' || transaction.status.toLowerCase() === 'successful' || transaction.status.toLowerCase() === 'completed'
                    ? 'bg-[#ECFDF3] text-[#027A48]'
                    : transaction.status.toLowerCase() === 'pending'
                        ? 'bg-[#fffaeb] text-[#DD6A02]'
                        : 'bg-[#FEF3F2] text-[#FF5050]'
                    }`}>
                    <p className="text-[12px] font-medium">
                        {transaction.status === '0' || transaction.status === 'success'
                            ? 'Successful'
                            : transaction.status}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center w-[3%]">
                <ActionsDropdown transactionId={transaction.id}>
                    <div className="flex flex-col gap-1">
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                    </div>
                </ActionsDropdown>
            </div>
        </div>
    );
};

const TransactionsTable = ({
    transactions,
    loading,
    currentPage,
    totalTransactions,
    onPageChange
}: {
    transactions: PaymentTransactionResponse[];
    loading: boolean;
    currentPage: number;
    totalTransactions: number;
    onPageChange: (page: number) => void;
}) => {
    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalTransactions / itemsPerPage);

    return (
        <div className="w-full flex flex-col h-auto border-[#EAECF0] border rounded-[24px]">
            <div className="w-full h-[91px] flex items-center justify-between px-[24px] pt-[20px] pb-[19px]">
                <div className="flex flex-col gap-[4px]">
                    <div className="h-[28px] flex items-center">
                        <p className="text-[18px] font-medium text-[#101828]">Transactions ({totalTransactions})</p>
                    </div>
                    <div className="flex h-[20px] items-center">
                        <p className="text-[14px] text-[#667085]">View and manage all transactions here</p>
                    </div>
                </div>

            </div>

            <div className="w-full h-[44px] flex bg-[#F9FAFB] border-b-[0.5px] border-[#EAECF0]">
                <div className="h-full w-[12%] flex justify-center items-center font-medium text-[#667085] text-[12px]">
                    <p>Transaction ID</p>
                </div>
                <div className="h-full w-[18%] gap-[4px] flex justify-center items-center font-medium text-[#667085] text-[12px]">
                    <p>Transaction type</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[22%] gap-[4px] flex px-[24px] items-center font-medium text-[#667085] text-[12px]">
                    <p>User</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>

                <div className="h-full w-[17%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Amount (NGN)</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>

                <div className="h-full w-[15%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Date and Time</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="flex w-[13%] items-center px-[24px] font-medium text-[#667085] text-[12px]">
                    Status
                </div>
                <div className="w-[3%]"></div>
            </div>

            <div className="flex flex-col">
                {loading ? (
                    <TransactionsTableSkeleton />
                ) : transactions.length > 0 ? (
                    transactions.map((transaction, index) => (
                        <TransactionTableRow
                            key={transaction.id}
                            transaction={transaction}
                            isLast={index === transactions.length - 1}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>No transactions found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#EAECF0]">
                    <div className="text-[14px] text-[#667085]">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} transactions
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Previous
                        </button>

                        {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;

                            if (totalPages <= maxVisiblePages) {
                                // Show all pages if total pages is less than or equal to maxVisiblePages
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => onPageChange(i)}
                                            className={`px-3 py-1 rounded border ${currentPage === i
                                                ? 'bg-[#022B23] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                            } else {
                                // Always show first page
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => onPageChange(1)}
                                        className={`px-3 py-1 rounded border ${currentPage === 1
                                            ? 'bg-[#022B23] text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        1
                                    </button>
                                );

                                // Show ellipsis if current page is far from start
                                if (currentPage > 3) {
                                    pages.push(
                                        <span key="ellipsis-start" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                // Show pages around current page
                                const startPage = Math.max(2, currentPage - 1);
                                const endPage = Math.min(totalPages - 1, currentPage + 1);

                                for (let i = startPage; i <= endPage; i++) {
                                    if (i !== 1 && i !== totalPages) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => onPageChange(i)}
                                                className={`px-3 py-1 rounded border ${currentPage === i
                                                    ? 'bg-[#022B23] text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                }

                                // Show ellipsis if current page is far from end
                                if (currentPage < totalPages - 2) {
                                    pages.push(
                                        <span key="ellipsis-end" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                // Always show last page
                                if (totalPages > 1) {
                                    pages.push(
                                        <button
                                            key={totalPages}
                                            onClick={() => onPageChange(totalPages)}
                                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                                ? 'bg-[#022B23] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    );
                                }
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const OverviewTab = () => {
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [totalPayoutAmount, setTotalPayoutAmount] = useState<number>(0);
    const [totalRefundAmount, setTotalRefundAmount] = useState<number>(0);
    const [transactions, setTransactions] = useState<PaymentTransactionResponse[]>([]);
    const [allTransactions, setAllTransactions] = useState<PaymentTransactionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [amountData, transactionsData, payoutAmountData] = await Promise.all([
                    paymentService.getTotalTransactionAmount(),
                    paymentService.getAllTransactions(),
                    paymentService.getTotalPayoutAmount()
                ]);

                setTotalAmount(amountData);
                setTotalPayoutAmount(payoutAmountData);
                setAllTransactions(transactionsData);
                console.log("All Transactions: ",transactionsData);
                // Fetch total refund amount
                try {
                    const refundResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/total-processed-amount`);
                    if (refundResponse.ok) {
                        const refundAmount = await refundResponse.json();
                        setTotalRefundAmount(refundAmount);
                    }
                } catch (refundError) {
                    console.error('Error fetching refund amount:', refundError);
                }

                // Set initial page transactions
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                setTransactions(transactionsData.slice(startIndex, endIndex));

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        // Update displayed transactions when page changes
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setTransactions(allTransactions.slice(startIndex, endIndex));
    }, [currentPage, allTransactions, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div className="flex w-full gap-[20px] mt-[20px] h-[86px] justify-between">
                <div className="flex flex-col w-[25%] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-[#ffffff] text-[12px]">Total transactions</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <StatsCardSkeleton width="w-32" />
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">N{totalAmount.toLocaleString()}.00</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[25%] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-white text-[12px]">Pay-outs processed</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <StatsCardSkeleton width="w-32" />
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">N{totalPayoutAmount.toLocaleString()}.00</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[25%] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-white text-[12px]">Total refunds processed</p>
                    </div>
                    <div className="h-[52px] w-[239px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <StatsCardSkeleton width="w-32" />
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">N{totalRefundAmount.toLocaleString()}.00</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[25%] rounded-[14px] h-full border-[#C6EB5F] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#022B23]">
                        <p className="text-[#C6EB5F] text-[12px]">Commission earned</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        <p className="text-[20px] text-[#022B23] font-medium">N0.00</p>
                    </div>
                </div>
            </div>
            <div className="mt-[50px]">
                <TransactionsTable
                    transactions={transactions}
                    loading={loading}
                    currentPage={currentPage}
                    totalTransactions={allTransactions.length}
                    onPageChange={handlePageChange}
                />
            </div>
        </>
    );
};

const PayoutTableRow = ({
    payout,
    isLast,
    onPayoutUpdated
}: {
    payout: PayoutResponse;
    isLast: boolean;
    onPayoutUpdated?: () => void;
}) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className={`flex h-[72px] ${!isLast ? 'border-b border-[#EAECF0]' : ''}`}>
            <div className="flex items-center w-[12%] pl-[24px]">
                <p className="text-[#101828] text-[14px] font-medium">#{payout.id}</p>
            </div>

            <div className="flex items-center w-[22%] px-[24px]">
                <p className="text-[#101828] text-[14px] font-medium">{payout.vendorName || 'Unknown Vendor'}</p>
            </div>

            <div className="flex items-center w-[17%] px-[20px]">
                <p className="text-[#101828] text-[14px]">N {payout.paidAmount.toLocaleString()}.00</p>
            </div>

            <div className="flex flex-col justify-center w-[15%] px-[20px]">
                <p className="text-[#101828] text-[14px] font-medium">{formatDate(payout.requestedAt)}</p>
                <p className="text-[#667085] text-[14px]">{formatTime(payout.requestedAt)}</p>
            </div>

            <div className="flex flex-col justify-center w-[15%] px-[20px]">
                <p className="text-[#101828] text-[14px] font-medium">{formatDate(payout.paidAt)}</p>
                <p className="text-[#667085] text-[14px]">{formatTime(payout.paidAt)}</p>
            </div>

            <div className="flex items-center w-[13%] px-[24px]">
                <div className={`w-[70px] h-[22px] rounded-[8px] flex items-center justify-center ${payout.paid
                    ? 'bg-[#ECFDF3] text-[#027A48]'
                    : 'bg-[#fffaeb] text-[#DD6A02]'
                    }`}>
                    <p className="text-[12px] font-medium">{payout.paid ? 'Paid' : 'Pending'}</p>
                </div>
            </div>

            <div className="flex items-center justify-center w-[3%]">
                <ActionsDropdown
                    transactionId={payout.id}
                    type="payout"
                    onPayoutUpdated={onPayoutUpdated}
                >
                    <div className="flex flex-col gap-1">
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                    </div>
                </ActionsDropdown>
            </div>
        </div>
    );
};

const PayoutsTable = ({
    payouts,
    loading,
    currentPage,
    totalPayouts,
    onPageChange,
    onPayoutUpdated
}: {
    payouts: PayoutResponse[];
    loading: boolean;
    currentPage: number;
    totalPayouts: number;
    onPageChange: (page: number) => void;
    onPayoutUpdated?: () => void;
}) => {
    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalPayouts / itemsPerPage);

    return (
        <div className="w-full flex flex-col h-auto border-[#EAECF0] border rounded-[24px]">
            <div className="w-full h-[91px] flex items-center justify-between px-[24px] pt-[20px] pb-[19px]">
                <div className="flex flex-col gap-[4px]">
                    <div className="h-[28px] flex items-center">
                        <p className="text-[18px] font-medium text-[#101828]">Payouts ({totalPayouts})</p>
                    </div>
                    <div className="flex h-[20px] items-center">
                        <p className="text-[14px] text-[#667085]">View and manage all payouts here</p>
                    </div>
                </div>

            </div>

            <div className="w-full h-[44px] flex bg-[#F9FAFB] border-b-[0.5px] border-[#EAECF0]">
                <div className="h-full w-[12%] flex justify-center items-center font-medium text-[#667085] text-[12px]">
                    <p>Payout ID</p>
                </div>
                <div className="h-full w-[22%] gap-[4px] flex px-[24px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Vendor</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[17%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Amount (NGN)</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[15%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Request Date</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[15%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Paid Date</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="flex w-[13%] items-center px-[24px] font-medium text-[#667085] text-[12px]">
                    Status
                </div>
                <div className="w-[3%]"></div>
            </div>

            <div className="flex flex-col">
                {loading ? (
                    // Loading skeleton
                    [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className={`flex h-[72px] ${i !== 8 ? 'border-b border-[#EAECF0]' : ''} animate-pulse`}>
                            <div className="flex items-center w-[12%] pl-[24px]">
                                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                            </div>
                            <div className="flex items-center w-[22%] px-[24px]">
                                <div className="bg-gray-200 h-4 w-24 rounded"></div>
                            </div>
                            <div className="flex items-center w-[17%] px-[20px]">
                                <div className="bg-gray-200 h-4 w-16 rounded"></div>
                            </div>
                            <div className="flex flex-col justify-center w-[15%] px-[20px] gap-1">
                                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                                <div className="bg-gray-200 h-3 w-16 rounded"></div>
                            </div>
                            <div className="flex flex-col justify-center w-[15%] px-[20px] gap-1">
                                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                                <div className="bg-gray-200 h-3 w-16 rounded"></div>
                            </div>
                            <div className="flex items-center w-[13%] px-[24px]">
                                <div className="bg-gray-200 h-5 w-16 rounded"></div>
                            </div>
                            <div className="flex items-center justify-center w-[3%]">
                                <div className="bg-gray-200 h-4 w-4 rounded"></div>
                            </div>
                        </div>
                    ))
                ) : payouts.length > 0 ? (
                    payouts.map((payout, index) => (
                        <PayoutTableRow
                            key={payout.id}
                            payout={payout}
                            isLast={index === payouts.length - 1}
                            onPayoutUpdated={onPayoutUpdated}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>No payouts found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#EAECF0]">
                    <div className="text-[14px] text-[#667085]">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalPayouts)} of {totalPayouts} payouts
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Previous
                        </button>

                        {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;

                            if (totalPages <= maxVisiblePages) {
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => onPageChange(i)}
                                            className={`px-3 py-1 rounded border ${currentPage === i
                                                ? 'bg-[#022B23] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                            } else {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => onPageChange(1)}
                                        className={`px-3 py-1 rounded border ${currentPage === 1
                                            ? 'bg-[#022B23] text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        1
                                    </button>
                                );

                                if (currentPage > 3) {
                                    pages.push(
                                        <span key="ellipsis-start" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                const startPage = Math.max(2, currentPage - 1);
                                const endPage = Math.min(totalPages - 1, currentPage + 1);

                                for (let i = startPage; i <= endPage; i++) {
                                    if (i !== 1 && i !== totalPages) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => onPageChange(i)}
                                                className={`px-3 py-1 rounded border ${currentPage === i
                                                    ? 'bg-[#022B23] text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                }

                                if (currentPage < totalPages - 2) {
                                    pages.push(
                                        <span key="ellipsis-end" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                if (totalPages > 1) {
                                    pages.push(
                                        <button
                                            key={totalPages}
                                            onClick={() => onPageChange(totalPages)}
                                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                                ? 'bg-[#022B23] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    );
                                }
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PayoutsTab = () => {
    const [payouts, setPayouts] = useState<PayoutResponse[]>([]);
    const [allPayouts, setAllPayouts] = useState<PayoutResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchPayouts = useCallback(async () => {
        try {
            setLoading(true);
            const payoutData = await paymentService.getAllPayouts();
            setAllPayouts(payoutData);

            // Set initial page payouts
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            setPayouts(payoutData.slice(startIndex, endIndex));
        } catch (error) {
            console.error('Error fetching payouts:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    useEffect(() => {
        // Update displayed payouts when page changes
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPayouts(allPayouts.slice(startIndex, endIndex));
    }, [currentPage, allPayouts]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePayoutUpdated = () => {
        fetchPayouts();
    };

    // Calculate statistics
    const totalPayoutAmount = allPayouts.reduce((sum, payout) => sum + payout.paidAmount, 0);
    const pendingPayouts = allPayouts.filter(payout => !payout.paid);
    const pendingAmount = pendingPayouts.reduce((sum, payout) => sum + payout.paidAmount, 0);
    const paidPayouts = allPayouts.filter(payout => payout.paid);
    const paidAmount = paidPayouts.reduce((sum, payout) => sum + payout.paidAmount, 0);

    return (
        <>
            <div className="flex w-full gap-[20px] mt-[20px] h-[86px] ">
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-[#ffffff] text-[12px]">Total payouts</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">N{totalPayoutAmount.toLocaleString()}.00</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-white text-[12px]">Paid</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">N{paidAmount.toLocaleString()}.00</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#DD6A02] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#FFFAEB]">
                        <p className="text-[#DD6A02] text-[12px]">Pending</p>
                    </div>
                    <div className="h-[52px] w-[239px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">N{pendingAmount.toLocaleString()}.00</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-[50px]">
                <PayoutsTable
                    payouts={payouts}
                    loading={loading}
                    currentPage={currentPage}
                    totalPayouts={allPayouts.length}
                    onPageChange={handlePageChange}
                    onPayoutUpdated={handlePayoutUpdated}
                />
            </div>
        </>
    );
};



// Refund interfaces
interface RefundResponse {
    id: number;
    orderNumber: string;
    buyerEmail: string;
    buyerName: string;
    vendorEmail: string;
    vendorName: string;
    shopName: string;
    refundAmount: number;
    reason: string;
    description: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'COMPLETED';
    processedBy?: string;
    refundReference?: string;
    adminNotes?: string;
    createdAt: string;
    processedAt?: string;
}

const RefundDetailsModal = ({
    refundId,
    onClose,
    onRefundUpdated,
}: {
    refundId: number;
    onClose: () => void;
    onRefundUpdated?: () => void;
}) => {
    const [refund, setRefund] = useState<RefundResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchRefundDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/getById?id=${refundId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch refund details');
                }
                const data = await response.json();
                setRefund(data);
            } catch (err) {
                console.error('Error fetching refund details:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch refund details');
            } finally {
                setLoading(false);
            }
        };

        fetchRefundDetails();
    }, [refundId]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleProcessRefund = async () => {
        if (!refund || refund.status !== 'PENDING') return;

        try {
            setProcessing(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/process?id=${refund.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to process refund');
            }

            const result = await response.text();
            toast.success(result);
            
            // Refresh refund details
            const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/getById?id=${refund.id}`);
            if (updatedResponse.ok) {
                const updatedRefund = await updatedResponse.json();
                setRefund(updatedRefund);
            }
            
            if (onRefundUpdated) {
                onRefundUpdated();
            }
        } catch (err) {
            console.error('Error processing refund:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
                <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative flex items-center justify-center">
                    <p>Loading refund details...</p>
                </div>
            </div>
        );
    }

    if (error || !refund) {
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
                <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || 'Refund not found'}</p>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'text-[#DD6A02] bg-[#fffaeb] border-[#DD6A02]';
            case 'APPROVED':
                return 'text-[#027A48] bg-[#ECFDF3] border-[#027A48]';
            case 'REJECTED':
                return 'text-[#FF5050] bg-[#FEF3F2] border-[#FF5050]';
            case 'PROCESSED':
                return 'text-[#0277BD] bg-[#E1F5FE] border-[#0277BD]';
            case 'COMPLETED':
                return 'text-[#027A48] bg-[#ECFDF3] border-[#027A48]';
            default:
                return 'text-[#DD6A02] bg-[#fffaeb] border-[#DD6A02]';
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#808080]/20">
            <div className="bg-white px-[60px] py-[50px] w-[597px] h-[620px] shadow-lg relative">
                <div className="w-full flex justify-between h-[60px] border-b-[0.5px] border-[#D9D9D9]">
                    <div className={`flex flex-col`}>
                        <p className={`text-[#022B23] text-[16px] font-medium`}>Refund details</p>
                        <p className="text-[#707070] text-[14px] font-medium">View details of refund request</p>
                    </div>
                    <span className={`w-[77px] text-[12px] font-medium flex justify-center items-center h-[32px] rounded-[8px] border ${getStatusColor(refund.status)}`}>
                        {refund.status}
                    </span>
                </div>

                <div className="w-full flex flex-col h-[430px] pt-[20px] pb-[2px] gap-[30px]">
                    <div className="flex flex-col h-[79px] gap-[6px]">
                        <p className="text-[16px] font-semibold text-[#022B23]">ID: <span>#{refund.id}</span></p>
                        <p className="text-[14px] font-medium text-[#707070]">Order: <span className="text-[#000000] underline">{refund.orderNumber}</span></p>
                        <p className="text-[14px] font-medium text-[#707070]">Buyer: <span className="text-[#000000] underline">{refund.buyerName}</span></p>
                    </div>

                    <div className="flex flex-col w-full pr-[30px]">
                        <p className="text-[14px] text-[#022B23] font-medium">Refund details</p>
                        <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Amount</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">₦{refund.refundAmount.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Reason</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{refund.reason}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Request Date</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{formatDate(refund.createdAt)}</p>
                            </div>
                            <div className="flex text-start justify-between items-center">
                                <p className="text-[14px] text-[#707070] font-medium">Request Time</p>
                                <p className="text-[14px] text-[#1E1E1E] font-medium">{formatTime(refund.createdAt)}</p>
                            </div>
                            {refund.processedAt && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[14px] text-[#707070] font-medium">Processed Date</p>
                                        <p className="text-[14px] text-[#1E1E1E] font-medium">{formatDate(refund.processedAt)}</p>
                                    </div>
                                    <div className="flex text-start justify-between items-center">
                                        <p className="text-[14px] text-[#707070] font-medium">Processed Time</p>
                                        <p className="text-[14px] text-[#1E1E1E] font-medium">{formatTime(refund.processedAt)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="w-[97%] px-[22px] flex flex-col gap-[9px] py-[14px] h-[130px] rounded-[24px] border-[1px] border-[#ededed]">
                        <p className="text-[16px] text-[#000000] font-medium">Refund Information</p>
                        <div className="flex flex-col gap-[5px]">
                            <p className="text-[14px] text-[#707070]">REFUND ID: #{refund.id}</p>
                            <p className="text-[14px] text-[#707070]">SHOP: {refund.shopName}</p>
                            <p className="text-[14px] text-[#707070]">STATUS: {refund.status}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-3 h-[46px] gap-[6px]">
                    {refund.status === 'PENDING' && (
                        <button
                            onClick={handleProcessRefund}
                            disabled={processing}
                            className={`justify-center text-[16px] font-medium flex items-center w-[120px] border rounded-[12px] ${processing
                                ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'text-[#027A48] border-[#027A48] hover:bg-[#027A48] hover:text-white'
                                }`}
                        >
                            {processing ? 'Processing...' : 'Process Refund'}
                        </button>
                    )}
                    <button onClick={onClose} className="justify-center text-[16px] font-medium flex items-center text-[#022B23] w-[87px] border border-[#022B23] rounded-[12px]">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const RefundTableRow = ({
    refund,
    isLast,
    onRefundUpdated
}: {
    refund: RefundResponse;
    isLast: boolean;
    onRefundUpdated?: () => void;
}) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-[#fffaeb] text-[#DD6A02]';
            case 'APPROVED':
                return 'bg-[#ECFDF3] text-[#027A48]';
            case 'REJECTED':
                return 'bg-[#FEF3F2] text-[#FF5050]';
            case 'PROCESSED':
                return 'bg-[#E1F5FE] text-[#0277BD]';
            case 'COMPLETED':
                return 'bg-[#ECFDF3] text-[#027A48]';
            default:
                return 'bg-[#fffaeb] text-[#DD6A02]';
        }
    };

    return (
        <div className={`flex h-[72px] ${!isLast ? 'border-b border-[#EAECF0]' : ''}`}>
            <div className="flex items-center w-[12%] pl-[24px]">
                <p className="text-[#101828] text-[14px] font-medium">#{refund.id}</p>
            </div>

            <div className="flex items-center w-[18%] px-[24px]">
                <p className="text-[#101828] text-[14px] font-medium">{refund.orderNumber}</p>
            </div>

            <div className="flex items-center w-[20%] px-[24px]">
                <p className="text-[#101828] text-[14px] font-medium">{refund.buyerName}</p>
            </div>

            <div className="flex items-center w-[15%] px-[20px]">
                <p className="text-[#101828] text-[14px]">₦{refund.refundAmount.toLocaleString()}</p>
            </div>

            <div className="flex flex-col justify-center w-[15%] px-[20px]">
                <p className="text-[#101828] text-[14px] font-medium">{formatDate(refund.createdAt)}</p>
                <p className="text-[#667085] text-[14px]">{formatTime(refund.createdAt)}</p>
            </div>

            <div className="flex items-center w-[13%] px-[24px]">
                <div className={`w-[80px] h-[22px] rounded-[8px] flex items-center justify-center ${getStatusColor(refund.status)}`}>
                    <p className="text-[12px] font-medium">{refund.status}</p>
                </div>
            </div>

            <div className="flex items-center justify-center w-[3%]">
                <ActionsDropdown
                    transactionId={refund.id}
                    type="refund"
                    onPayoutUpdated={onRefundUpdated}
                >
                    <div className="flex flex-col gap-1">
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                    </div>
                </ActionsDropdown>
            </div>
        </div>
    );
};

const RefundsTable = ({
    refunds,
    loading,
    currentPage,
    totalRefunds,
    onPageChange,
    onRefundUpdated
}: {
    refunds: RefundResponse[];
    loading: boolean;
    currentPage: number;
    totalRefunds: number;
    onPageChange: (page: number) => void;
    onRefundUpdated?: () => void;
}) => {
    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalRefunds / itemsPerPage);

    return (
        <div className="w-full flex flex-col h-auto border-[#EAECF0] border rounded-[24px]">
            <div className="w-full h-[91px] flex items-center justify-between px-[24px] pt-[20px] pb-[19px]">
                <div className="flex flex-col gap-[4px]">
                    <div className="h-[28px] flex items-center">
                        <p className="text-[18px] font-medium text-[#101828]">Refunds ({totalRefunds})</p>
                    </div>
                    <div className="flex h-[20px] items-center">
                        <p className="text-[14px] text-[#667085]">View and manage all refund requests here</p>
                    </div>
                </div>

            </div>

            <div className="w-full h-[44px] flex bg-[#F9FAFB] border-b-[0.5px] border-[#EAECF0]">
                <div className="h-full w-[12%] flex justify-center items-center font-medium text-[#667085] text-[12px]">
                    <p>Refund ID</p>
                </div>
                <div className="h-full w-[18%] gap-[4px] flex px-[24px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Order Number</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[20%] gap-[4px] flex px-[24px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Buyer</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[15%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Amount (NGN)</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="h-full w-[15%] gap-[4px] flex px-[20px] items-center font-medium text-[#667085] text-[12px]">
                    <p>Request Date</p>
                    <Image src={arrowDown} alt={'image'} />
                </div>
                <div className="flex w-[13%] items-center px-[24px] font-medium text-[#667085] text-[12px]">
                    Status
                </div>
                <div className="w-[3%]"></div>
            </div>

            <div className="flex flex-col">
                {loading ? (
                    // Loading skeleton
                    [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className={`flex h-[72px] ${i !== 8 ? 'border-b border-[#EAECF0]' : ''} animate-pulse`}>
                            <div className="flex items-center w-[12%] pl-[24px]">
                                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                            </div>
                            <div className="flex items-center w-[18%] px-[24px]">
                                <div className="bg-gray-200 h-4 w-24 rounded"></div>
                            </div>
                            <div className="flex items-center w-[20%] px-[24px]">
                                <div className="bg-gray-200 h-4 w-24 rounded"></div>
                            </div>
                            <div className="flex items-center w-[15%] px-[20px]">
                                <div className="bg-gray-200 h-4 w-16 rounded"></div>
                            </div>
                            <div className="flex flex-col justify-center w-[15%] px-[20px] gap-1">
                                <div className="bg-gray-200 h-4 w-20 rounded"></div>
                                <div className="bg-gray-200 h-3 w-16 rounded"></div>
                            </div>
                            <div className="flex items-center w-[13%] px-[24px]">
                                <div className="bg-gray-200 h-5 w-16 rounded"></div>
                            </div>
                            <div className="flex items-center justify-center w-[3%]">
                                <div className="bg-gray-200 h-4 w-4 rounded"></div>
                            </div>
                        </div>
                    ))
                ) : refunds.length > 0 ? (
                    refunds.map((refund, index) => (
                        <RefundTableRow
                            key={refund.id}
                            refund={refund}
                            isLast={index === refunds.length - 1}
                            onRefundUpdated={onRefundUpdated}
                        />
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>No refunds found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-[24px] py-[16px] border-t border-[#EAECF0]">
                    <div className="text-[14px] text-[#667085]">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRefunds)} of {totalRefunds} refunds
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded border ${currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Previous
                        </button>

                        {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;

                            if (totalPages <= maxVisiblePages) {
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => onPageChange(i)}
                                            className={`px-3 py-1 rounded border ${currentPage === i
                                                ? 'bg-[#022B23] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                            } else {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => onPageChange(1)}
                                        className={`px-3 py-1 rounded border ${currentPage === 1
                                            ? 'bg-[#022B23] text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        1
                                    </button>
                                );

                                if (currentPage > 3) {
                                    pages.push(
                                        <span key="ellipsis-start" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                const startPage = Math.max(2, currentPage - 1);
                                const endPage = Math.min(totalPages - 1, currentPage + 1);

                                for (let i = startPage; i <= endPage; i++) {
                                    if (i !== 1 && i !== totalPages) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => onPageChange(i)}
                                                className={`px-3 py-1 rounded border ${currentPage === i
                                                    ? 'bg-[#022B23] text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        );
                                    }
                                }

                                if (currentPage < totalPages - 2) {
                                    pages.push(
                                        <span key="ellipsis-end" className="px-2 py-1 text-gray-500">
                                            ...
                                        </span>
                                    );
                                }

                                if (totalPages > 1) {
                                    pages.push(
                                        <button
                                            key={totalPages}
                                            onClick={() => onPageChange(totalPages)}
                                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                                ? 'bg-[#022B23] text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    );
                                }
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded border ${currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RefundsTab = () => {
    const [refunds, setRefunds] = useState<RefundResponse[]>([]);
    const [allRefunds, setAllRefunds] = useState<RefundResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProcessedAmount, setTotalProcessedAmount] = useState<number>(0);
    const itemsPerPage = 8;

    const fetchRefunds = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch all refunds using the backend endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/all`);
            if (!response.ok) {
                throw new Error('Failed to fetch refunds');
            }
            const refundData = await response.json();
            setAllRefunds(refundData);

            // Set initial page refunds
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            setRefunds(refundData.slice(startIndex, endIndex));
        } catch (error) {
            console.error('Error fetching refunds:', error);
            toast.error('Failed to fetch refunds');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    const fetchTotalProcessedAmount = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/total-processed-amount`);
            if (!response.ok) {
                throw new Error('Failed to fetch total processed amount');
            }
            const amount = await response.json();
            setTotalProcessedAmount(amount);
        } catch (error) {
            console.error('Error fetching total processed amount:', error);
        }
    }, []);

    useEffect(() => {
        fetchRefunds();
        fetchTotalProcessedAmount();
    }, [fetchRefunds, fetchTotalProcessedAmount]);

    useEffect(() => {
        // Update displayed refunds when page changes
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setRefunds(allRefunds.slice(startIndex, endIndex));
    }, [currentPage, allRefunds]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleRefundUpdated = () => {
        fetchRefunds();
        fetchTotalProcessedAmount();
    };

    // Calculate statistics
    const totalRefundAmount = allRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);
    const pendingRefunds = allRefunds.filter(refund => refund.status === 'PENDING');
    const pendingAmount = pendingRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const approvedRefunds = allRefunds.filter(refund => refund.status === 'APPROVED');
    const completedRefunds = allRefunds.filter(refund => refund.status === 'COMPLETED');
    const completedAmount = completedRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);

    return (
        <>
            <div className="flex w-full gap-[20px] mt-[20px] h-[86px] ">
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-[#ffffff] text-[12px]">Total refunds</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">₦{totalRefundAmount.toLocaleString()}</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-white text-[12px]">Pending</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">₦{pendingAmount.toLocaleString()}</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-white text-[12px]">Total Processed</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">₦{totalProcessedAmount.toLocaleString()}</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col w-[270px] rounded-[14px] h-full border-[#EAEAEA] border-[0.5px]">
                    <div className="w-full px-[14px] flex items-center rounded-tl-[14px] rounded-tr-[14px] h-[34px] bg-[#000000]">
                        <p className="text-white text-[12px]">Completed</p>
                    </div>
                    <div className="h-[52px] flex justify-center flex-col p-[14px]">
                        {loading ? (
                            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                        ) : (
                            <p className="text-[20px] text-[#022B23] font-medium">₦{completedAmount.toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-[50px]">
                <RefundsTable
                    refunds={refunds}
                    loading={loading}
                    currentPage={currentPage}
                    totalRefunds={allRefunds.length}
                    onPageChange={handlePageChange}
                    onRefundUpdated={handleRefundUpdated}
                />
            </div>
        </>
    );
};

const AdminTransactionClient = () => {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'overview' | 'pay-outs' | 'refunds' || 'overview';
    const [activeTab, setActiveTab] = useState<'overview' | 'pay-outs' | 'refunds'>(initialTab);
    const router = useRouter();

    const handleTabChange = (tab: 'overview' | 'pay-outs' | 'refunds') => {
        setActiveTab(tab);
        router.replace(`/admin/dashboard/transactions?tab=${tab}`, { scroll: false });
    };

    return (
        <>
            <div className="text-[#022B23] text-[14px] px-[20px] font-medium gap-[8px] flex items-center h-[49px] w-full border-b-[0.5px] border-[#ededed]">
                <p>Transactions</p>
            </div>
            <div className="flex flex-col">
                <div className="flex border-b border-[#ededed] mb-6 px-[20px]">
                    <div className="w-[403px] h-[52px] gap-[24px] flex items-end">
                        <p
                            className={`py-2 text-[#11151F] cursor-pointer text-[14px] ${activeTab === 'overview' ? 'font-medium  border-b-2 border-[#000000]' : 'text-[#707070]'}`}
                            onClick={() => handleTabChange('overview')}
                        >
                            Transactions overview
                        </p>
                        <p
                            className={`py-2 text-[#11151F] cursor-pointer text-[14px] ${activeTab === 'pay-outs' ? 'font-medium  border-b-2 border-[#000000]' : 'text-[#707070]'}`}
                            onClick={() => handleTabChange('pay-outs')}
                        >
                            Pay-outs (withdrawals)
                        </p>
                        <p
                            className={`py-2 text-[#11151F] cursor-pointer text-[14px] ${activeTab === 'refunds' ? 'font-medium border-b-2 border-[#000000]' : 'text-[#707070]'}`}
                            onClick={() => handleTabChange('refunds')}
                        >
                            Refunds
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg mx-[20px] mb-8">
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'pay-outs' && <PayoutsTab />}
                    {activeTab === 'refunds' && <RefundsTab />}
                </div>
            </div>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    );
};

export default AdminTransactionClient;