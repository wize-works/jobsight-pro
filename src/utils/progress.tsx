
export const progressBar = (value: number | null | undefined = 0, max: number = 100) => {
    if (value === null || value === undefined) {
        value = 0;
    }

    let progressClass = "progress w-full";
    if (value < 25) {
        progressClass += " progress-error";
    } else if (value < 50) {
        progressClass += " progress-warning";
    } else if (value < 75) {
        progressClass += " progress-info";
    } else {
        progressClass += " progress-success";
    }
    return (
        <progress className={progressClass} value={value} max={max}></progress>
    );
}