interface Animal {
  species?: string;
  family?: string;
  habitat?: string;
}

const ANIMALS_API_URL = 'http://localhost:3001/api/animals';
const WEIGHTS_API_URL = 'http://localhost:3001/api/weights';
const WEATHER_API_URL = 'http://localhost:3001/api/weather-data';
const MIN_WEIGHT = 50;
const MAX_WEIGHT = 400;

interface WeatherEntry {
  day: number;
  max_temp: number;
  min_temp: number;
}

interface WeightSubmissionResponse {
  message: string;
  data: {
    id: number;
    weight: number;
    createdAt: string;
  };
}

interface SavedWeight {
  id: number;
  weight: number;
  createdAt: string;
}

interface WeightsResponse {
  data: SavedWeight[];
}

async function submitWeight(weight: number): Promise<WeightSubmissionResponse> {
  const response = await fetch(WEIGHTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ weight })
  });

  if (!response.ok) {
    throw new Error('Failed to submit weight to mock server.');
  }

  const result = (await response.json()) as WeightSubmissionResponse;
  return result;
}

function toAnimalArray(value: unknown): Animal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return {};
    }

    const record = item as Record<string, unknown>;

    return {
      species: typeof record.species === 'string' ? record.species : undefined,
      family: typeof record.family === 'string' ? record.family : undefined,
      habitat: typeof record.habitat === 'string' ? record.habitat : undefined
    };
  });
}

function toWeatherArray(value: unknown): WeatherEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const day = Number(record.day);
      const maxTemp = Number(record.max_temp);
      const minTemp = Number(record.min_temp);

      if (!Number.isFinite(day) || !Number.isFinite(maxTemp) || !Number.isFinite(minTemp)) {
        return null;
      }

      return {
        day,
        max_temp: maxTemp,
        min_temp: minTemp
      };
    })
    .filter((entry): entry is WeatherEntry => entry !== null)
    .sort((a, b) => a.day - b.day);
}

console.log('Competition project loaded!');

function initializeAnimalsTable(): void {
  const animalsTableBody = document.getElementById('animals-table-body');
  const animalsStatus = document.getElementById('animals-status');

  if (!(animalsTableBody instanceof HTMLTableSectionElement)) {
    return;
  }

  if (!(animalsStatus instanceof HTMLParagraphElement)) {
    return;
  }

  const animalsTableBodyEl: HTMLTableSectionElement = animalsTableBody;
  const animalsStatusEl: HTMLParagraphElement = animalsStatus;

  function createCell(value?: string): HTMLTableCellElement {
    const td = document.createElement('td');
    td.textContent = value || 'N/A';
    return td;
  }

  function renderAnimals(animals: Animal[]): void {
    animalsTableBodyEl.innerHTML = '';

    animals.forEach((animal) => {
      const row = document.createElement('tr');

      row.appendChild(createCell(animal.species));
      row.appendChild(createCell(animal.family));
      row.appendChild(createCell(animal.habitat));

      animalsTableBodyEl.appendChild(row);
    });
  }

  async function loadAnimals(): Promise<void> {
    try {
      const response = await fetch(ANIMALS_API_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch animal data.');
      }

      const jsonData: unknown = await response.json();
      const data = toAnimalArray(jsonData);

      if (!Array.isArray(data) || data.length === 0) {
        animalsStatusEl.textContent = 'No animals found.';
        return;
      }

      animalsStatusEl.textContent = `Loaded ${data.length} animals.`;
      renderAnimals(data);
    } catch (error) {
      animalsStatusEl.textContent = 'Unable to load animals right now.';
      animalsStatusEl.classList.add('error-message');
    }
  }

  loadAnimals();
}

function initializeWeightFormValidation(): void {
  const weightForm = document.getElementById('weight-form');
  const weightInput = document.getElementById('weight-input');
  const weightMessage = document.getElementById('weight-message');

  if (!(weightForm instanceof HTMLFormElement)) {
    return;
  }

  if (!(weightInput instanceof HTMLInputElement)) {
    return;
  }

  if (!(weightMessage instanceof HTMLParagraphElement)) {
    return;
  }

  weightInput.addEventListener('keydown', (event: KeyboardEvent) => {
    const blockedKeys = ['e', 'E', '+', '-', '.'];

    if (blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
  });

  // Cleans pasted/inserted content so only digits remain.
  weightInput.addEventListener('input', () => {
    weightInput.value = weightInput.value.replace(/\D/g, '');
  });

  weightForm.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();

    const rawValue = weightInput.value.trim();

    if (!/^\d+$/.test(rawValue)) {
      weightMessage.textContent = 'Only numeric characters are allowed.';
      weightMessage.classList.remove('success-message');
      weightMessage.classList.add('error-message');
      return;
    }

    const weightValue = Number(rawValue);

    if (!Number.isFinite(weightValue)) {
      weightMessage.textContent = 'Please enter a valid number.';
      weightMessage.classList.remove('success-message');
      weightMessage.classList.add('error-message');
      return;
    }

    if (weightValue < MIN_WEIGHT || weightValue > MAX_WEIGHT) {
      weightMessage.textContent = `Weight must be between ${MIN_WEIGHT} and ${MAX_WEIGHT}.`;
      weightMessage.classList.remove('success-message');
      weightMessage.classList.add('error-message');
      return;
    }

    try {
      const result = await submitWeight(weightValue);
      weightMessage.textContent = `${result.message} (ID: ${result.data.id})`;
      weightMessage.classList.remove('error-message');
      weightMessage.classList.add('success-message');
      weightForm.reset();
    } catch (error) {
      weightMessage.textContent = 'Could not submit weight. Is mock server running on port 3001?';
      weightMessage.classList.remove('success-message');
      weightMessage.classList.add('error-message');
    }
  });
}

function initializeWeatherChart(): void {
  const weatherStatus = document.getElementById('weather-status');
  const weatherChart = document.getElementById('weather-chart');

  if (!(weatherStatus instanceof HTMLParagraphElement)) {
    return;
  }

  if (!(weatherChart instanceof HTMLDivElement)) {
    return;
  }

  const weatherStatusEl: HTMLParagraphElement = weatherStatus;
  const weatherChartEl: HTMLDivElement = weatherChart;

  function createSvgElement<T extends keyof SVGElementTagNameMap>(
    tagName: T,
    attributes: Record<string, string>
  ): SVGElementTagNameMap[T] {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  function renderChart(data: WeatherEntry[]): void {
    weatherChartEl.innerHTML = '';

    const width = 820;
    const height = 420;
    const paddingLeft = 76;
    const paddingRight = 30;
    const paddingTop = 70;
    const paddingBottom = 64;

    const minDay = Math.min(...data.map((entry) => entry.day));
    const maxDay = Math.max(...data.map((entry) => entry.day));
    const minTemp = Math.min(...data.map((entry) => Math.min(entry.max_temp, entry.min_temp)));
    const maxTemp = Math.max(...data.map((entry) => Math.max(entry.max_temp, entry.min_temp)));

    const safeMaxDay = maxDay === minDay ? maxDay + 1 : maxDay;
    const safeMaxTemp = maxTemp === minTemp ? maxTemp + 1 : maxTemp + 2;
    const safeMinTemp = minTemp - 2;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const toX = (day: number): number =>
      paddingLeft + ((day - minDay) / (safeMaxDay - minDay)) * chartWidth;
    const toY = (temp: number): number =>
      paddingTop + chartHeight - ((temp - safeMinTemp) / (safeMaxTemp - safeMinTemp)) * chartHeight;

    const svg = createSvgElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
      'aria-label': 'Line chart of maximum and minimum temperature by day'
    });

    const gridLines = 6;
    for (let i = 0; i <= gridLines; i += 1) {
      const y = paddingTop + (i / gridLines) * chartHeight;
      const tempValue = safeMaxTemp - (i / gridLines) * (safeMaxTemp - safeMinTemp);

      const grid = createSvgElement('line', {
        x1: String(paddingLeft),
        y1: String(y),
        x2: String(width - paddingRight),
        y2: String(y),
        class: 'chart-grid'
      });
      svg.appendChild(grid);

      const yTickLabel = createSvgElement('text', {
        x: String(paddingLeft - 12),
        y: String(y + 4),
        'text-anchor': 'end',
        class: 'chart-label'
      });
      yTickLabel.textContent = `${Math.round(tempValue)}`;
      svg.appendChild(yTickLabel);
    }

    data.forEach((entry) => {
      const x = toX(entry.day);
      const dayGrid = createSvgElement('line', {
        x1: String(x),
        y1: String(paddingTop),
        x2: String(x),
        y2: String(height - paddingBottom),
        class: 'chart-grid chart-grid-vertical'
      });
      svg.appendChild(dayGrid);
    });

    const xAxis = createSvgElement('line', {
      x1: String(paddingLeft),
      y1: String(height - paddingBottom),
      x2: String(width - paddingRight),
      y2: String(height - paddingBottom),
      class: 'chart-axis'
    });

    const yAxis = createSvgElement('line', {
      x1: String(paddingLeft),
      y1: String(paddingTop),
      x2: String(paddingLeft),
      y2: String(height - paddingBottom),
      class: 'chart-axis'
    });

    svg.appendChild(xAxis);
    svg.appendChild(yAxis);

    const maxPoints = data.map((entry) => `${toX(entry.day)},${toY(entry.max_temp)}`).join(' ');
    const minPoints = data.map((entry) => `${toX(entry.day)},${toY(entry.min_temp)}`).join(' ');

    const maxPolyline = createSvgElement('polyline', {
      points: maxPoints,
      class: 'chart-line'
    });
    const minPolyline = createSvgElement('polyline', {
      points: minPoints,
      class: 'chart-line chart-line-min'
    });

    svg.appendChild(maxPolyline);
    svg.appendChild(minPolyline);

    const legendY = 32;
    const legendMaxMark = createSvgElement('rect', {
      x: String(paddingLeft + 6),
      y: String(legendY - 9),
      width: '36',
      height: '16',
      class: 'chart-legend-box'
    });
    const legendMinMark = createSvgElement('rect', {
      x: String(paddingLeft + 176),
      y: String(legendY - 9),
      width: '36',
      height: '16',
      class: 'chart-legend-box chart-legend-box-min'
    });

    const legendMaxText = createSvgElement('text', {
      x: String(paddingLeft + 48),
      y: String(legendY + 4),
      class: 'chart-label'
    });
    legendMaxText.textContent = 'Max Temperature';

    const legendMinText = createSvgElement('text', {
      x: String(paddingLeft + 218),
      y: String(legendY + 4),
      class: 'chart-label'
    });
    legendMinText.textContent = 'Min Temperature';

    svg.appendChild(legendMaxMark);
    svg.appendChild(legendMinMark);
    svg.appendChild(legendMaxText);
    svg.appendChild(legendMinText);

    data.forEach((entry) => {
      const x = toX(entry.day);
      const yMax = toY(entry.max_temp);
      const yMin = toY(entry.min_temp);

      const maxPoint = createSvgElement('circle', {
        cx: String(x),
        cy: String(yMax),
        r: '3.5',
        class: 'chart-point'
      });
      const minPoint = createSvgElement('circle', {
        cx: String(x),
        cy: String(yMin),
        r: '3.5',
        class: 'chart-point chart-point-min'
      });

      const xLabel = createSvgElement('text', {
        x: String(x),
        y: String(height - paddingBottom + 22),
        'text-anchor': 'middle',
        class: 'chart-label'
      });
      xLabel.textContent = `Day ${entry.day}`;

      svg.appendChild(maxPoint);
      svg.appendChild(minPoint);
      svg.appendChild(xLabel);
    });

    const yAxisTitle = createSvgElement('text', {
      x: '16',
      y: String(height / 2),
      transform: `rotate(-90 16 ${height / 2})`,
      class: 'chart-label'
    });
    yAxisTitle.textContent = 'Temperature (C)';
    svg.appendChild(yAxisTitle);

    const xAxisTitle = createSvgElement('text', {
      x: String(paddingLeft + chartWidth / 2),
      y: String(height - 18),
      'text-anchor': 'middle',
      class: 'chart-label'
    });
    xAxisTitle.textContent = 'Day';
    svg.appendChild(xAxisTitle);

    weatherChartEl.appendChild(svg);
  }

  async function loadWeatherData(): Promise<void> {
    try {
      const response = await fetch(WEATHER_API_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch weather data.');
      }

      const jsonData: unknown = await response.json();
      const weatherData = toWeatherArray(jsonData);

      if (weatherData.length === 0) {
        weatherStatusEl.textContent = 'No weather data found.';
        weatherStatusEl.classList.add('error-message');
        return;
      }

      weatherStatusEl.textContent = `Loaded ${weatherData.length} weather records.`;
      weatherStatusEl.classList.remove('error-message');
      renderChart(weatherData);
    } catch (error) {
      weatherStatusEl.textContent = 'Unable to load weather data right now.';
      weatherStatusEl.classList.add('error-message');
    }
  }

  loadWeatherData();
}

function initializeWeightsTable(): void {
  const weightsStatus = document.getElementById('weights-status');
  const weightsTableBody = document.getElementById('weights-table-body');

  if (!(weightsStatus instanceof HTMLParagraphElement)) {
    return;
  }

  if (!(weightsTableBody instanceof HTMLTableSectionElement)) {
    return;
  }

  const weightsStatusEl: HTMLParagraphElement = weightsStatus;
  const weightsTableBodyEl: HTMLTableSectionElement = weightsTableBody;

  function createCell(value: string): HTMLTableCellElement {
    const td = document.createElement('td');
    td.textContent = value;
    return td;
  }

  function renderWeights(weights: SavedWeight[]): void {
    weightsTableBodyEl.innerHTML = '';

    weights.forEach((item) => {
      const row = document.createElement('tr');
      row.appendChild(createCell(String(item.id)));
      row.appendChild(createCell(String(item.weight)));
      row.appendChild(createCell(new Date(item.createdAt).toLocaleString()));
      weightsTableBodyEl.appendChild(row);
    });
  }

  async function loadWeights(): Promise<void> {
    try {
      const response = await fetch(WEIGHTS_API_URL);

      if (!response.ok) {
        throw new Error('Failed to fetch weights.');
      }

      const payload = (await response.json()) as WeightsResponse;
      const weights = Array.isArray(payload.data) ? payload.data : [];

      if (weights.length === 0) {
        weightsStatusEl.textContent = 'No weights saved yet.';
        return;
      }

      weightsStatusEl.textContent = `Loaded ${weights.length} weights.`;
      weightsStatusEl.classList.remove('error-message');
      renderWeights(weights);
    } catch (error) {
      weightsStatusEl.textContent = 'Unable to load weights right now.';
      weightsStatusEl.classList.add('error-message');
    }
  }

  loadWeights();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is fully loaded');

  initializeAnimalsTable();
  initializeWeightFormValidation();
  initializeWeightsTable();
  initializeWeatherChart();
});
