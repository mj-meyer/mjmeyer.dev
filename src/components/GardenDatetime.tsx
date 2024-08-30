export interface Props {
  datetime: string | Date;
}

export default function GardenDatetime({ datetime }: Props) {
  return (
    <div className={`inline-flex items-center space-x-2 font-montserrat`}>
      <span className={`whitespace-nowrap text-sm`}>
        <FormattedDatetime datetime={datetime} />
      </span>
    </div>
  );
}

const FormattedDatetime = ({ datetime }: { datetime: string | Date }) => {
  const myDatetime = new Date(datetime);

  const year = myDatetime.toLocaleDateString([], {
    year: "numeric",
  });

  const month = myDatetime.toLocaleDateString([], {
    month: "short",
  });

  const day = myDatetime.toLocaleDateString([], {
    day: "numeric",
  });

  return (
    <span className="flex flex-col text-center leading-none">
      <span className="text-3xl font-black text-skin-accent/40 leading-none tracking-wider">
        {day}
      </span>
      <span className="uppercase text-skin-base tracking-widest border-b pb-1 mb-1">
        {month}
      </span>
      <span className="tracking-wider text-skin-base">{year}</span>
    </span>
  );
};
