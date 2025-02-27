"use client";
import { useRouter } from "next/navigation";
import { useLoading } from "../context/LoadingContext";
import Image from "next/image";

const SessionEndModal = ({ isOpen, onClose, conversationSaved }) => {
  const router = useRouter();
  const { setLoading } = useLoading();

  const redirect = async () => {
    if (conversationSaved) {
      setLoading(true);
      await router.push("/");
      setLoading(false);
      onClose();
    } else {
      setLoading(false); // Stop loading if conversation isn't saved
      console.log("Conversation not saved yet.");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 self-center bg-opacity-50 flex justify-center items-center modal-blur">
          <div className="modal-content p-8 rounded items-center shadow-lg relative">
            <h4 className="text-center text-2xl font-semibold leading-tight text-shadow-lg">
              WELL DONE!
            </h4>
            <div className="flex justify-center mb-4">
              <Image
                src="/practice_questions.png"
                width={200}
                height={200}
                alt="No data"
                className="transition duration-300 hover:scale-110"
              />
            </div>
            <p className="text-white text-base text-center break-normal mb-2">
              Great job! You&apos;ve successfully completed your practice
              session. Your effort and dedication are truly commendable. Keep up
              the excellent work! We are saving the session, and your feedback
              report will be available shortly on your profile, so be sure to
              check it out!
            </p>

            {/* Dynamic Saving Status */}
            <p
              className={`text-left font-medium ${
                conversationSaved ? "text-[#6D81F2]" : "text-[#F25E86]"
              }`}
            >
              {conversationSaved
                ? "✅ Session saved!"
                : "💾 Saving the session..."}
            </p>

            <button
              onClick={redirect}
              className={`btn resetModal-btn btn-block w-full text-white py-2 mt-4 mb-4 rounded ${
                conversationSaved ? "" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!conversationSaved}
            >
              FINISH
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionEndModal;
