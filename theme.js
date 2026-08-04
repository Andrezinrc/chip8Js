const buttons = document.querySelectorAll(".theme-btn");

function applyTheme(theme)
{
    document.body.classList.remove("theme-plum", "theme-slate");

    buttons.forEach(button => button.classList.remove("active"));

    if(theme !== "classic")
        document.body.classList.add(`theme-${theme}`);

    document.querySelector(`[data-theme="${theme}"]`)?.classList.add("active");
}


buttons.forEach(button => {
    button.addEventListener("click", ()=>{

        const theme = button.dataset.theme;
        applyTheme(theme);

        localStorage.setItem("theme", theme);
    });
});


const savedTheme = localStorage.getItem("theme") || "classic";

applyTheme(savedTheme);
