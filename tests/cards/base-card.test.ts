// Mocks
import { createMock } from "ts-auto-mock";
import SkyTonightNativeCard from "../../src";

// Models
import { SkyTonightNativeCardConfig } from "../../src/types/sky-tonight-native-card-types";

// Importing test data
import SkyTonight from "../../src/cards/sky-tonight-native";

describe('Testing base-card file', () => {
    const parent = createMock<SkyTonightNativeCard>({ 
        config: createMock<SkyTonightNativeCardConfig>()
    });

    test.each`
    key | expected
    ${'days'}, ${'दिन'}
    `('Calling translation should return correct translation', ({ key, expected }) => { 
        // Arrange
        parent.config.translations = {  
            "days" : "दिन"
        };

        // Act
        const card = new SkyTonight(parent);

        // Assert
        expect(card.translation(key)).toBe(expected);
    })
});