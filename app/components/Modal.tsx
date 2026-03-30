import { useState } from "react";

const Modal = () => {
  const [mosque, setMosque] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-stone-700/75 backdrop-blur-sm flex justify-center items-center">
      
      <form className="bg-white rounded-lg w-[420px] p-6 flex flex-col gap-4">
        
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold">Add Lead</h2>
          <p className="text-sm text-gray-500">
            Quickly capture a mosque you connected with
          </p>
        </div>

        {/* Mosque Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="mosque">Mosque Name (required)</label>
          <input
            id="mosque"
            type="text"
            placeholder="e.g. Masjid Al-Noor"
            value={mosque}
            onChange={(e) => setMosque(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        {/* City + State */}
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="flex flex-col gap-1 w-20">
            <label htmlFor="state">State</label>
            <input
              id="state"
              type="text"
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-1">
          <label htmlFor="contactName">Contact Name</label>
          <input
            id="contactName"
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="contactEmail">Contact Email</label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            placeholder="How did you connect?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border rounded px-2 py-1 h-20 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="text-gray-500">
            Cancel
          </button>
          <button
            type="submit"
            className="bg-black text-white px-4 py-1 rounded"
          >
            Add Lead
          </button>
        </div>

      </form>
    </div>
  );
};

export default Modal;