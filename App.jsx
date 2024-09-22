import React, { useState } from 'react';
import './App.css'; // Ensure CSS is imported


          {error && (
            <div className="error-message">
              <h3>Error:</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
