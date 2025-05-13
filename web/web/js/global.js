function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.matches('.nav-link') && !event.target.matches('.profile-pic') && !event.target.matches('.nav-link span')) {
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
