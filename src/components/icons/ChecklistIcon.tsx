interface ChecklistIconProps {
  className?: string;
}

export const ChecklistIcon = ({ className }: ChecklistIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
    className={className}
  >
    <path
      d="M12.3332 8.33301V4.53301C12.3332 3.4129 12.3332 2.85285 12.1152 2.42503C11.9234 2.0487 11.6175 1.74274 11.2412 1.55099C10.8133 1.33301 10.2533 1.33301 9.13317 1.33301H4.8665C3.7464 1.33301 3.18635 1.33301 2.75852 1.55099C2.3822 1.74274 2.07624 2.0487 1.88449 2.42503C1.6665 2.85285 1.6665 3.4129 1.6665 4.53301V11.4663C1.6665 12.5864 1.6665 13.1465 1.88449 13.5743C2.07624 13.9506 2.3822 14.2566 2.75852 14.4484C3.18635 14.6663 3.74638 14.6663 4.86646 14.6663H6.99984M8.6665 12.6663L9.99984 13.9997L12.9998 10.9997"
      stroke="#C2764B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
