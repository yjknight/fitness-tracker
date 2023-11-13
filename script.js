'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// Running
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// Cycling
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run = new Running([5.6037168, -0.1869644], 4, 8, 4);
// const cyc = new Cycling([5.6037168, -0.1869644], 8, 12, 6);
// console.log(run, cyc);
////////////////////////////////////////////////////////
const workoutContainer = document.querySelector('.workout__form');
const form = document.querySelector('.form');
const inputType = document.querySelector('.form__input--type');
const distanceInputField = document.querySelector('.input__field--distance');
const durationInputField = document.querySelector('.input__field--duration');
const cadenceInputField = document.querySelector('.input__field--cadence');
const elevationGainInputField = document.querySelector('.input__field--elev');

class App {
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user position
    this._getCurrentPosition();

    // load workout
    this._LoadWorkoutLocalStorage();

    // Attach Event Handler
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    workoutContainer.addEventListener('click', this._moveToPopup.bind(this));
  }

  // Get Position
  _getCurrentPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadCoordinates.bind(this)
      ),
        function () {
          alert(`Coordinates could not be found!`);
        };
    }
  }

  // load Coordinates
  _loadCoordinates(position) {
    {
      const { latitude: lat, longitude: lng } = position.coords;

      const coords = [lat, lng];

      this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

      L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.#map);
    }

    // Handle form event
    this.#map.on('click', this._showForm.bind(this));

    // render workout on map
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  // Show Form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    distanceInputField.focus();
  }

  // Hide form
  _hideForm() {
    // clear inputs
    distanceInputField.value =
      durationInputField.value =
      cadenceInputField.value =
      elevationGainInputField.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Render Marker On Map
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 280,
          minWidth: 150,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  // Create new workout
  _newWorkout(e) {
    e.preventDefault();

    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));

    const validNum = (...inputs) => inputs.every(num => num > 0);

    // Get data from form
    const type = inputType.value;
    const distance = +distanceInputField.value;
    const duration = +durationInputField.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running + verify inputs
    if (type === 'running') {
      const cadence = +cadenceInputField.value;

      if (
        !validInput(distance, duration, cadence) ||
        !validNum(distance, duration, cadence)
      )
        return alert(`Inputs must be numbers.`);

      workout = new Running([lat, lng], distance, duration, cadence);
      this.#workouts.push(workout);
    }

    // If workout is cycling + verify inputs
    if (type === 'cycling') {
      const elevation = +elevationGainInputField.value;

      if (
        !validInput(distance, duration, elevation) ||
        validNum(distance, duration, elevation)
      )
        return alert(`Inputs must be positive numbers`);

      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.#workouts.push(workout);
    }

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Set workout - local storage
    this._setLocalStorage();

    // Clear input + hide form
    this._hideForm();
  }

  // Create workout
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type} data-id='${workout.id}' radius">
      <p class="title">${workout.description}</p>
      <div>
        <div class="workout__details">
          <span class="icon"> ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
          <span class="time">${workout.distance}</span>
          <span class="unit">km</span>
        </div>
      <div class="workout__details">
          <span class="icon">⏱️</span>
          <span class="time">${workout.duration}</span>
          <span class="unit">min</span>
     </div>
    `;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
          <span class="icon">⚡</span>
          <span class="vlaue">${workout.pace.toFixed(1)}</span>
          <span class="unit">min/km</span>
      </div>
      <div class="workout__details">
          <span class="icon">🦶</span>
          <span class="steps">${workout.cadence}</span>
          <span class="unit">spm</span>
      </div>
      </div>
    </li>
      `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="icon">⚡</span>
        <span class="value">${workout.speed.toFixed(1)}</span>
        <span class="unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="icon">🗻</span>
        <span class="steps">${workout.elevation}</span>
        <span class="unit">m</span>
        </div>
      </div>
    </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  // Move to maker
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // Store workout to local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // Load workout from local storage
  _LoadWorkoutLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // Switch input type
  _toggleElevationField() {
    cadenceInputField
      .closest('.form__item')
      .classList.toggle('form__item--hidden');
    elevationGainInputField
      .closest('.form__item')
      .classList.toggle('form__item--hidden');
  }

  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
