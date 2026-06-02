import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
}

const entityTypes = ["Corporation", "Partnership", "Sole Proprietorship", "Trust", "Non-Profit"];
const engagementPartners = ["Cpt ℞", "Norbert ℞", "Sarah M.", "James K."];
const provinces = ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba"];
const countries = ["Canada", "United States", "United Kingdom", "Australia"];

const RequiredStar = () => <span style={{ color: "hsl(0 72% 51%)" }}>*</span>;

const FieldLabel = ({ label, required = false }: { label: string; required?: boolean }) => (
  <label className="block text-sm font-semibold text-foreground mb-1.5">
    {label}{required && <RequiredStar />}
  </label>
);

const TextInput = ({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2.5 rounded-[10px] border text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
    style={{ borderColor: "hsl(var(--border))" }}
  />
);

const SelectInput = ({ placeholder, options, value, onChange }: { placeholder: string; options: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-[10px] border text-sm bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow cursor-pointer"
      style={{ borderColor: "hsl(var(--border))", color: value ? undefined : "hsl(var(--muted-foreground))" }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
  </div>
);

const AddClientModal = ({ open, onClose }: AddClientModalProps) => {
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [engagementPartner, setEngagementPartner] = useState("");

  // Optional fields
  const [showMore, setShowMore] = useState(false);
  const [clientId, setClientId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const isValid = entityName.trim() && entityType && firstName.trim() && lastName.trim() && email.trim() && engagementPartner;

  const handleAdd = () => {
    if (!isValid) return;
    onClose();
  };

  const handleReset = () => {
    setEntityName(""); setEntityType(""); setFirstName(""); setLastName("");
    setEmail(""); setEngagementPartner(""); setClientId(""); setGroupName("");
    setBusinessPhone(""); setCellPhone(""); setAddress(""); setCity("");
    setProvince(""); setCountry(""); setPostalCode(""); setShowMore(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "hsl(0 0% 0% / 0.4)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full max-w-[780px] max-h-[85vh] overflow-y-auto rounded-2xl border bg-card p-7"
            style={{ borderColor: "hsl(var(--border))", boxShadow: "0 20px 60px hsl(0 0% 0% / 0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Add New Client</h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Required Fields */}
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Required Information</p>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                <div>
                  <FieldLabel label="Entity Name" required />
                  <TextInput placeholder="Entity Name" value={entityName} onChange={setEntityName} />
                </div>
                <div>
                  <FieldLabel label="Entity Type" required />
                  <SelectInput placeholder="Entity Type" options={entityTypes} value={entityType} onChange={setEntityType} />
                </div>
                <div>
                  <FieldLabel label="First Name" required />
                  <TextInput placeholder="First Name" value={firstName} onChange={setFirstName} />
                </div>
                <div>
                  <FieldLabel label="Last Name" required />
                  <TextInput placeholder="Last Name" value={lastName} onChange={setLastName} />
                </div>
                <div>
                  <FieldLabel label="Email" required />
                  <TextInput placeholder="Email" value={email} onChange={setEmail} />
                </div>
                <div>
                  <FieldLabel label="Engagement Partner" required />
                  <SelectInput placeholder="Engagement Partner" options={engagementPartners} value={engagementPartner} onChange={setEngagementPartner} />
                </div>
              </div>
            </div>

            {/* Optional Fields Toggle */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1.5 mt-5 mb-3 text-sm font-medium transition-colors"
              style={{ color: "#1c63a6" }}
            >
              {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showMore ? "Hide additional details" : "Add more details (optional)"}
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4 pb-2">
                    <div>
                      <FieldLabel label="Client ID (Only AlphaNumeric)" />
                      <TextInput placeholder="Client ID" value={clientId} onChange={setClientId} />
                    </div>
                    <div>
                      <FieldLabel label="Group Name" />
                      <TextInput placeholder="Group Name" value={groupName} onChange={setGroupName} />
                    </div>
                    <div>
                      <FieldLabel label="Business Phone" />
                      <TextInput placeholder="Business Phone" value={businessPhone} onChange={setBusinessPhone} />
                    </div>
                    <div>
                      <FieldLabel label="Cell Phone" />
                      <TextInput placeholder="Cell Phone" value={cellPhone} onChange={setCellPhone} />
                    </div>
                    <div>
                      <FieldLabel label="Address" />
                      <TextInput placeholder="Address" value={address} onChange={setAddress} />
                    </div>
                    <div>
                      <FieldLabel label="City" />
                      <TextInput placeholder="City" value={city} onChange={setCity} />
                    </div>
                    <div>
                      <FieldLabel label="Province/State" />
                      <SelectInput placeholder="Province / State" options={provinces} value={province} onChange={setProvince} />
                    </div>
                    <div>
                      <FieldLabel label="Country" />
                      <SelectInput placeholder="Country" options={countries} value={country} onChange={setCountry} />
                    </div>
                    <div>
                      <FieldLabel label="Postal/Zip Code" />
                      <TextInput placeholder="Postal/Zip Code" value={postalCode} onChange={setPostalCode} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t" style={{ borderColor: "hsl(var(--border))" }}>
              <button
                onClick={() => { handleReset(); onClose(); }}
                className="px-5 py-2.5 rounded-[12px] text-sm font-medium border text-foreground hover:bg-accent transition-colors"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={isValid ? { scale: 1.03 } : {}}
                whileTap={isValid ? { scale: 0.97 } : {}}
                onClick={handleAdd}
                disabled={!isValid}
                className="px-6 py-2.5 rounded-[12px] text-sm font-semibold text-white transition-all"
                style={{
                  background: isValid ? "#1c63a6" : "hsl(var(--muted))",
                  color: isValid ? "white" : "hsl(var(--muted-foreground))",
                  cursor: isValid ? "pointer" : "not-allowed",
                }}
              >
                Add Client
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddClientModal;
